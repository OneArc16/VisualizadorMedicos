import { useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'


export default function LoginPage() {
  const [codigo_empleado, setCodigoEmpleado] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_empleado, clave }),
    })

    if (res.ok) {
      toast.success('¡Bienvenido!')
      setTimeout(() => router.push('/dashboard'), 1500)
    } else {
      toast.error('Credenciales inválidas') 
      const data = await res.json()
      setError(data.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 space-y-4 bg-white rounded shadow-md"
      >
        <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>

        {error && <p className="text-sm text-center text-red-500">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Usuario</label>
          <input
            type="text"
            value={codigo_empleado}
            onChange={(e) => setCodigoEmpleado(e.target.value)}
            className="w-full px-3 py-2 mt-1 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Clave</label>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="w-full px-3 py-2 mt-1 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
