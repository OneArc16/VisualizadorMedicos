import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/utils/verifyToken'

// Mapa de especialidad → cups
const especialidadToCups: Record<string, string> = {
  '016': '890201', // Medicina General
  '022': '890203', // Odontología
  '062': '890262', // Medicina Laboral
  '036': '890206', // Nutrición
}

// Extraer token desde cookie
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  const token = getTokenFromCookies(req)
  if (!token || !verificarToken(token)) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  const { codigo_empleado, nueva_especialidad } = req.body

  if (!codigo_empleado || !nueva_especialidad) {
    return res.status(400).json({ message: 'Faltan parámetros' })
  }

  const nuevoCups = especialidadToCups[nueva_especialidad]
  if (!nuevoCups) {
    return res.status(400).json({ message: 'Código de especialidad no válido' })
  }

  try {
    const actualizados = await prisma.especialidad_empleados.updateMany({
      where: { C_digo_empleado: codigo_empleado },
      data: {
        C_digo_especialidad: nueva_especialidad,
        Cups: nuevoCups,
      },
    })

    if (actualizados.count === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado o sin especialidades' })
    }

    return res.status(200).json({ message: 'Especialidad actualizada correctamente' })
  } catch (error) {
    console.error('Error actualizando especialidad:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}