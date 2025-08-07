import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import type { especialidad_empleados } from '@prisma/client'
import { verificarToken } from '@/utils/verifyToken'

// ✅ Extraer token desde las cookies manualmente
function getTokenFromCookies(req: NextApiRequest): string | null {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, ...v] = cookie.trim().split('=')
      return [key, decodeURIComponent(v.join('='))]
    })
  )

  return cookies['token'] || null
}

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  const token = getTokenFromCookies(req)
  if (!token || !verificarToken(token)) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  const { codigo_empleado } = req.body

  if (!codigo_empleado) {
    return res.status(400).json({ message: 'Falta el código del empleado' })
  }

  try {
    // ✅ Obtener especialidades del médico con tipo explícito
    const especialidades: especialidad_empleados[] = await prisma.especialidad_empleados.findMany({
      where: { Código_empleado: parseInt(codigo_empleado) },
    })

    if (especialidades.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' })
    }

    // ✅ Alternar el valor del campo bot
    const nuevoValor = especialidades.some((e) => e.bot === 'si') ? 'no' : 'si'

    // ✅ Actualizar todas las filas del mismo empleado
    await prisma.especialidad_empleados.updateMany({
      where: { Código_empleado: parseInt(codigo_empleado) },
      data: { bot: nuevoValor },
    })

    return res.status(200).json({ message: `Bot actualizado a '${nuevoValor}'` })
  } catch (error) {
    console.error('Error actualizando bot:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
