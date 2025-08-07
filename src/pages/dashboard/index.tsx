import { GetServerSideProps } from 'next'
import { verificarToken } from '@/utils/verifyToken'
import { useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

type Medico = {
  C_digo_empleado: string
  Nombre_empleado: string
  especialidades: string[]
  bot: string
}

type TokenPayload = {
  id: string
  nombre: string
  iat: number
  exp: number
}

// ✅ Diccionario para traducir códigos de especialidades
const NOMBRES_ESPECIALIDADES: Record<string, string> = {
  '016': 'Medicina General',
  '022': 'Odontología',
}

export default function Dashboard({ nombre, medicosIniciales }: { nombre: string; medicosIniciales: Medico[] }) {
  const [medicos, setMedicos] = useState<Medico[]>(medicosIniciales)
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/logout')
    router.push('/login')
  }

  const toggleBot = async (codigo_empleado: string) => {
    const res = await fetch('/api/medicos/actualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_empleado }),
    })

    if (res.ok) {
      setMedicos((prev) =>
        prev.map((m) =>
          m.C_digo_empleado === codigo_empleado
            ? { ...m, bot: m.bot === 'SI' ? 'NO' : 'SI' }
            : m
        )
      )
      toast.success('Visibilidad actualizada correctamente')
    } else {
      toast.error('Error al cambiar estado del médico')
    }
  }

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>

      <p className="mb-4">Bienvenido, {nombre}. Aquí verás los médicos activos en el bot.</p>

      <table className="w-full bg-white border rounded">
        <thead>
          <tr className="text-left bg-gray-100">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Especialidades</th>
            <th className="p-2 border">Bot</th>
            <th className="p-2 border">Acción</th>
          </tr>
        </thead>
        <tbody>
          {medicos.map((medico) => (
            <tr key={medico.C_digo_empleado}>
              <td className="p-2 border">{medico.Nombre_empleado}</td>
              <td className="p-2 border">
                {medico.especialidades
                  .map((cod) => NOMBRES_ESPECIALIDADES[cod] || cod)
                  .join(', ')}
              </td>
              <td className="p-2 border">
                <span className={medico.bot === 'SI' ? 'text-green-600' : 'text-gray-500'}>
                  {medico.bot === 'SI' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => toggleBot(medico.C_digo_empleado)}
                  className={`px-3 py-1 rounded text-white ${
                    medico.bot === 'SI'
                      ? 'bg-gray-500 hover:bg-gray-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {medico.bot === 'SI' ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieHeader = req.headers.cookie || ''
  const token = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('token='))?.split('=')[1]

  if (!token) {
    return {
      redirect: { destination: '/login', permanent: false },
    }
  }

  const datos = verificarToken(token) as TokenPayload | null

  if (!datos) {
    return {
      redirect: { destination: '/login', permanent: false },
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/medicos/medicos`, {
    headers: { Cookie: `token=${token}` },
  })

  if (!res.ok) {
    return {
      props: { nombre: datos.nombre, medicosIniciales: [] },
    }
  }

  const medicos = await res.json()

  return {
    props: {
      nombre: datos.nombre,
      medicosIniciales: medicos,
    },
  }
}
