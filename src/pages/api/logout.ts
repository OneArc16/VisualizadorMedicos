import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Elimina la cookie del token
  const cookie = serialize('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })

  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ message: 'Sesión cerrada' })
}
