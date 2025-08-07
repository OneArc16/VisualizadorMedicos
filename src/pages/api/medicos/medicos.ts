import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/utils/verifyToken'

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
  const token = getTokenFromCookies(req)
  if (!token || !verificarToken(token)) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  try {
    const especialidades = await prisma.especialidad_empleados.findMany({
      where: {
        bot: 'SI',
        C_digo_especialidad: { in: ['016', '022'] },
      },
    })

    const medicosMap: Record<string, {
      C_digo_empleado: string
      Nombre_empleado: string
      especialidades: string[]
      bot: string
    }> = {}

    for (const esp of especialidades) {
      const codigoEmpleado = esp.C_digo_empleado

      if (!medicosMap[codigoEmpleado]) {
        const empleado = await prisma.empleados.findUnique({
          where: { C_digo_empleado: codigoEmpleado },
        })

        if (!empleado) continue

        medicosMap[codigoEmpleado] = {
          C_digo_empleado: codigoEmpleado,
          Nombre_empleado: empleado.Nombre_empleado,
          especialidades: [esp.C_digo_especialidad],
          bot: esp.bot || 'NO',
        }
      } else {
        medicosMap[codigoEmpleado].especialidades.push(esp.C_digo_especialidad)
      }
    }

    console.log('Especialidades filtradas:', especialidades)
    console.log('MedicosMap generado:', medicosMap) 

    const medicos = Object.values(medicosMap)

    return res.status(200).json(medicos)
  } catch (error) {
    console.error('Error al obtener médicos:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
