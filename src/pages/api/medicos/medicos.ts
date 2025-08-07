import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { verificarToken } from '@/utils/verifyToken'

// Función para extraer el token JWT de las cookies manualmente
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
  const token = getTokenFromCookies(req)

  // Validar si hay token
  if (!token) {
    return res.status(401).json({ message: 'Token no encontrado' })
  }

  // Validar si es válido
  const usuario = verificarToken(token)
  if (!usuario) {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }

  try {
    // Obtener especialidades (de la tabla especialidad_empleados)
    const especialidades = await prisma.especialidad_empleados.findMany()

    // Construir mapa para agrupar por médico
    const medicosMap: Record<string, {
      nombre: string
      especialidades: string[]
      bot: boolean
    }> = {}

    for (const esp of especialidades) {
      const codigoEmpleado = esp.Código_empleado
      const empleado = await prisma.empleados.findFirst({
        where: { id: codigoEmpleado }
      })

      if (!empleado) continue

      if (!medicosMap[codigoEmpleado]) {
        medicosMap[codigoEmpleado] = {
          nombre: empleado.nombre,
          especialidades: [],
          bot: Boolean(esp.bot),
        }
      }

      medicosMap[codigoEmpleado].especialidades.push(esp.Código_especialidad)
    }

    // Convertir el mapa a array
    const medicos = Object.entries(medicosMap).map(([codigo_empleado, datos]) => ({
      codigo_empleado,
      ...datos
    }))

    return res.status(200).json(medicos)
  } catch (error) {
    console.error('Error al obtener médicos:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
