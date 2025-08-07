import { GetServerSideProps } from 'next'
import { verificarToken } from '@/utils/verifyToken'
import { useState } from 'react'
import { useRouter } from 'next/router'

type Medico = {
  codigo_empleado: string
  nombre: string
  especialidades: string[]
  bot: string
}

type TokenPayload = {
  id: number
  nombre: string
  usuario: string
  iat: number
  exp: number
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
          m.codigo_empleado === codigo_empleado
            ? { ...m, bot: m.bot === 'si' ? 'no' : 'si' }
            : m
        )
      )
    }
    else {
          alert('Error al cambiar estado del médico')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>

      <p className="mb-4">Bienvenido, {nombre}. Aquí verás los médicos activos en el bot.</p>

      <table className="w-full border rounded bg-white">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Especialidades</th>
            <th className="p-2 border">Bot</th>
            <th className="p-2 border">Acción</th>
          </tr>
        </thead>
        <tbody>
          {medicos.map((medico) => (
            <tr key={medico.codigo_empleado}>
              <td className="p-2 border">{medico.nombre}</td>
              <td className="p-2 border">{medico.especialidades.join(', ')}</td>
              <td className="p-2 border">
                <span className={medico.bot ? 'text-green-600' : 'text-gray-500'}>
                  {medico.bot ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => toggleBot(medico.codigo_empleado)}
                  className={`px-3 py-1 rounded text-white ${
                    medico.bot ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {medico.bot ? 'Desactivar' : 'Activar'}
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

  // Obtener médicos desde el API backend
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/medicos/medico`, {
    headers: { Cookie: `token=${token}` },
  })

  const medicos = await res.json()

  return {
    props: {
      nombre: datos.nombre,
      medicosIniciales: medicos,
    },
  }
}
