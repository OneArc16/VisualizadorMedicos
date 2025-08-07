import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto-super-seguro'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  const { codigo_empleado, clave } = req.body

  if (!codigo_empleado || !clave) {
    return res.status(400).json({ message: 'Código de empleado y clave son requeridos' })
  }

  try {
    const empleado = await prisma.empleados.findUnique({
      where: { C_digo_empleado: codigo_empleado },
    })

    if (!empleado || empleado.Clave !== clave) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const token = jwt.sign(
      {
        id: empleado.C_digo_empleado,
        nombre: empleado.Nombre_empleado,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.setHeader(
      'Set-Cookie',
      serialize('token', token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 8,
      })
    )

    return res.status(200).json({ message: 'Autenticación exitosa' })
  } catch (error) {
    console.error('Error en login:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
