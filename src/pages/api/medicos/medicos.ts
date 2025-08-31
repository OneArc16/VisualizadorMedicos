import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/utils/verifyToken'

// Leer token desde cookie (mismo helper que usas en otras APIs)
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

// normaliza contrato a MAYÚSCULAS sin espacios
const norm = (v?: string | null) => (v ?? '').trim().toUpperCase()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getTokenFromCookies(req)
  if (!token || !verificarToken(token)) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  try {
    // Traemos especialidades visibles en el panel (ajusta los códigos si quieres)
    const especialidades = await prisma.especialidad_empleados.findMany({
      where: {
        bot: { in: ['SI', 'NO'] },
        C_digo_especialidad: { in: ['016', '022', '036', '062'] },
      },
      // si tu campo Principal es booleano, esto prioriza las filas principales
      orderBy: [{ Principal: 'desc' as const }],
    })

    type Item = {
      C_digo_empleado: string
      Nombre_empleado: string
      especialidades: string[]
      bot: string
      contrato?: string
    }

    const medicosMap: Record<string, Item> = {}

    for (const esp of especialidades) {
      const codigoEmpleado = esp.C_digo_empleado

      // busca/crea el contenedor del médico
      if (!medicosMap[codigoEmpleado]) {
        const empleado = await prisma.empleados.findUnique({
          where: { C_digo_empleado: codigoEmpleado },
        })
        if (!empleado) continue

        medicosMap[codigoEmpleado] = {
          C_digo_empleado: codigoEmpleado,
          Nombre_empleado: empleado.Nombre_empleado,
          especialidades: [],
          bot: esp.bot ?? 'NO',
          contrato: norm(esp.contrato) || undefined, // <<--- guardamos contrato
        }
      }

      // agrega especialidad
      medicosMap[codigoEmpleado].especialidades.push(esp.C_digo_especialidad)

      // si aún no teníamos contrato y esta fila sí trae, úsalo
      const c = norm(esp.contrato)
      if (!medicosMap[codigoEmpleado].contrato && c) {
        medicosMap[codigoEmpleado].contrato = c
      }

      // sincroniza bot a 'SI' si cualquiera de sus filas está en 'SI'
      if (esp.bot === 'SI') medicosMap[codigoEmpleado].bot = 'SI'
    }

    const medicos = Object.values(medicosMap)

    return res.status(200).json(medicos)
  } catch (error) {
    console.error('Error al obtener médicos:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
