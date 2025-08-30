import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/utils/verifyToken'

// Extraer token desde cookie
function getTokenFromCookies(req: NextApiRequest): string | null {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, decodeURIComponent(v.join('='))]
    })
  )
  return cookies['token'] || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' })

  const token = getTokenFromCookies(req)
  if (!token || !verificarToken(token)) return res.status(401).json({ message: 'No autorizado' })

  const { codigo_empleado, contrato } = req.body as { codigo_empleado?: string; contrato?: string }
  if (!codigo_empleado) return res.status(400).json({ message: 'Falta el código del empleado' })

  // Guardaremos el CÓDIGO de EPS (p.ej. "EPS008"). Permitimos vacío para "sin contrato".
  const valor = (contrato ?? '').trim().toUpperCase()
  if (valor && !/^[A-Z0-9]{3,10}$/.test(valor)) {
    return res.status(400).json({ message: 'Código de EPS inválido' })
  }

  try {
    const resp = await prisma.especialidad_empleados.updateMany({
      where: { C_digo_empleado: codigo_empleado },
      data: { contrato: valor || null },
    })

    if (resp.count === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado o sin especialidades' })
    }

    return res.status(200).json({ message: 'Contrato actualizado', contrato: valor })
  } catch (error) {
    console.error('Error actualizando contrato:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
