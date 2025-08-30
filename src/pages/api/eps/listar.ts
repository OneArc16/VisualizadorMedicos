import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/utils/verifyToken'

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
  const token = getTokenFromCookies(req)
  if (!token || !verificarToken(token)) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  try {
    const eps = await prisma.$queryRaw<{ value: string; label: string }[]>`
      SELECT Codigo AS value, NombreEntidad AS label
      FROM tventidades
      ORDER BY NombreEntidad
    `
    return res.status(200).json(eps)
  } catch (error) {
    console.error('Error listando EPS:', error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
