import { GetServerSideProps } from 'next'
import { verificarToken } from '@/utils/verifyToken'
import { useState } from 'react'
import { useRouter } from 'next/router'
import toast, { Toaster } from 'react-hot-toast'
import Swal from 'sweetalert2'

// Tipos

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

const opcionesEspecialidades = [
  { codigo: '016', nombre: 'Medicina General' },
  { codigo: '022', nombre: 'Odontología' },
  { codigo: '062', nombre: 'Medicina Laboral' },
  { codigo: '036', nombre: 'Nutrición' },
]

export default function Dashboard({ nombre, medicosIniciales }: { nombre: string; medicosIniciales: Medico[] }) {
  const [medicos, setMedicos] = useState<Medico[]>(medicosIniciales)
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [filtroBot, setFiltroBot] = useState('')
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/logout')
    router.push('/login')
  }

  const toggleBot = async (codigo_empleado: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cambiar el estado del bot para este médico?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      showClass: {
      popup: 'animate__animated animate__fadeInDown',
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp',
    },
    })

    if (!result.isConfirmed) return

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
      toast.success('Estado del bot actualizado', { position: 'top-center' })
    } else {
      toast.error('Error al actualizar estado del médico', { position: 'top-center' })
    }
  }
  

  // const toggleBot = async (codigo_empleado: string) => {
  //   const res = await fetch('/api/medicos/actualizar', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ codigo_empleado }),
  //   })

  //   if (res.ok) {
  //     setMedicos((prev) =>
  //       prev.map((m) =>
  //         m.C_digo_empleado === codigo_empleado
  //           ? { ...m, bot: m.bot === 'SI' ? 'NO' : 'SI' }
  //           : m
  //       )
  //     )
  //     toast.success('Estado del bot actualizado', { position: 'top-center' })
  //   } else {
  //     toast.error('Error al actualizar estado del médico', { position: 'top-center' })
  //   }
  // }

    const cambiarEspecialidad = async (codigo_empleado: string, nuevaEspecialidad: string) => {
    const result = await Swal.fire({
      title: '¿Cambiar especialidad?',
      text: '¿Deseas cambiar la especialidad de este médico?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      showClass: {
      popup: 'animate__animated animate__fadeInDown',
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp',
    },
    })

    if (!result.isConfirmed) return
    
    const res = await fetch('/api/medicos/cambiarespecialidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_empleado, nueva_especialidad: nuevaEspecialidad }),
    })

    if (res.ok) {
      setMedicos((prev) =>
        prev.map((m) =>
          m.C_digo_empleado === codigo_empleado
            ? { ...m, especialidades: [nuevaEspecialidad] }
            : m
        )
      )
      toast.success('Especialidad actualizada', { position: 'top-center' })
    } else {
      toast.error('Error al cambiar especialidad', { position: 'top-center' })
    }
  }


  // const cambiarEspecialidad = async (codigo_empleado: string, nuevaEspecialidad: string) => {
  //   const res = await fetch('/api/medicos/cambiarespecialidad', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ codigo_empleado, nueva_especialidad: nuevaEspecialidad }),
  //   })

  //   if (res.ok) {
  //     setMedicos((prev) =>
  //       prev.map((m) =>
  //         m.C_digo_empleado === codigo_empleado
  //           ? { ...m, especialidades: [nuevaEspecialidad] }
  //           : m
  //       )
  //     )
  //     toast.success('Especialidad actualizada', { position: 'top-center' })
  //   } else {
  //     toast.error('Error al cambiar especialidad', { position: 'top-center' })
  //   }
  // }

  const limpiarFiltros = () => {
    setFiltroNombre('')
    setFiltroEspecialidad('')
    setFiltroBot('')
  }

  const medicosFiltrados = medicos.filter((medico) => {
    const coincideNombre = medico.Nombre_empleado.toLowerCase().includes(filtroNombre.toLowerCase())
    const coincideEspecialidad = filtroEspecialidad === '' || medico.especialidades.includes(filtroEspecialidad)
    const coincideBot = filtroBot === '' || medico.bot === filtroBot

    return coincideNombre && coincideEspecialidad && coincideBot
  })

  return (
    <div className="max-w-6xl p-6 mx-auto">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          className: 'animate-fade-in',
        }}
      />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>

      <p className="mb-4">Bienvenido, {nombre}. Aquí puedes ver y modificar los médicos visibles en el bot.</p>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
          className="px-3 py-2 border rounded w-60"
        />

        <select
          value={filtroEspecialidad}
          onChange={(e) => setFiltroEspecialidad(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">Todas las especialidades</option>
          {opcionesEspecialidades.map((esp) => (
            <option key={esp.codigo} value={esp.codigo}>{esp.nombre}</option>
          ))}
        </select>

        <select
          value={filtroBot}
          onChange={(e) => setFiltroBot(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">Todos</option>
          <option value="SI">Activos</option>
          <option value="NO">Inactivos</option>
        </select>

        <button
          onClick={limpiarFiltros}
          className="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
        >
          Limpiar filtros
        </button>
      </div>

      <table className="w-full bg-white border rounded">
        <thead>
          <tr className="text-left bg-gray-100">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Especialidad</th>
            <th className="p-2 border">Bot</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {medicosFiltrados.map((medico) => (
            <tr key={medico.C_digo_empleado}>
              <td className="p-2 border">{medico.Nombre_empleado}</td>
              <td className="p-2 border">
                <select
                  value={medico.especialidades[0]}
                  onChange={(e) => cambiarEspecialidad(medico.C_digo_empleado, e.target.value)}
                  className="px-2 py-1 border rounded"
                >
                  {opcionesEspecialidades.map((esp) => (
                    <option key={esp.codigo} value={esp.codigo}>{esp.nombre}</option>
                  ))}
                </select>
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
  const token = cookieHeader.split(';').find((c) => c.trim().startsWith('token='))?.split('=')[1]

  if (!token) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const datos = verificarToken(token) as TokenPayload | null
  if (!datos) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/medicos/medicos`, {
    headers: { Cookie: `token=${token}` },
  })

  if (!res.ok) {
    return { props: { nombre: datos.nombre, medicosIniciales: [] } }
  }

  const medicos = await res.json()
  return { props: { nombre: datos.nombre, medicosIniciales: medicos } }
}
