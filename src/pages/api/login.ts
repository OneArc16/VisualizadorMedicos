import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  const { usuario, clave } = req.body

  if (!usuario || !clave) {
    return res.status(400).json({ message: 'Faltan credenciales' })
  }

  const empleado = await prisma.empleados.findFirst({
    where: { usuario, clave },
  })

  if (!empleado) {
    return res.status(401).json({ message: 'Credenciales inválidas' })
  }

  // Crear el token
  const token = jwt.sign(
    {
      id: empleado.id,
      nombre: empleado.nombre,
      usuario: empleado.usuario,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  // Guardar token en cookie HTTP-only
  const cookie = serialize('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8, // 8 horas
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  })

  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ message: 'Login exitoso' })
}
