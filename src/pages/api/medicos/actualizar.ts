import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/utils/verifyToken'

// Función para extraer el token de las cookies
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

  const { codigo_empleado } = req.body

  if (!codigo_empleado) {
    return res.status(400).json({ message: 'Falta el código del empleado' })
  }

  try {
    const especialidades = await prisma.especialidad_empleados.findMany({
      where: { C_digo_empleado: codigo_empleado },
    })

    if (especialidades.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' })
    }

    // Cambiar entre 'SI' y 'NO' (en mayúsculas)
    const nuevoValor = especialidades.some(e => e.bot === 'SI') ? 'NO' : 'SI'

    await prisma.especialidad_empleados.updateMany({
      where: { C_digo_empleado: codigo_empleado },
      data: { bot: nuevoValor },
    })

    return res.status(200).json({
      message: `El médico fue ${nuevoValor === 'SI' ? 'activado' : 'desactivado'} correctamente.`,
      nuevoValor
    })
  } catch (error) {
    console.error('Error actualizando bot:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
