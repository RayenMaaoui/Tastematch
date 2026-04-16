import { useEffect, useState } from 'react'
import { clearAuthSession, getApiUrl, getAuthHeaders, getAuthSession } from '../lib/auth'

const initialRestaurants = [
  { name: 'Bella Italia', category: 'Italian', rating: '4.8', status: 'Active' },
  { name: 'Tokyo Sushi Bar', category: 'Japanese', rating: '4.9', status: 'Active' },
  { name: 'The Burger Joint', category: 'Fast Food', rating: '4.5', status: 'Active' },
  { name: 'Spice Garden', category: 'Indian', rating: '4.7', status: 'Pending' },
  { name: 'La Boulangerie', category: 'Bakery', rating: '4.6', status: 'Active' },
]

export default function AdminPage() {
  const [session, setSession] = useState(() => getAuthSession())
  const [restaurants, setRestaurants] = useState(initialRestaurants)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const verifyAdmin = async () => {
      const currentSession = getAuthSession()
      if (!currentSession?.token || currentSession?.user?.role !== 'admin') {
        window.location.href = '/'
        return
      }

      try {
        const response = await fetch(getApiUrl('/api/auth/me'), {
          headers: {
            ...getAuthHeaders(),
          },
        })

        if (!response.ok) {
          throw new Error('Invalid session')
        }

        const user = await response.json()
        if (user.role !== 'admin') {
          window.location.href = '/'
          return
        }

        setSession((prev) => ({ ...prev, user }))
        setAuthChecked(true)
      } catch {
        clearAuthSession()
        window.location.href = '/login'
      }
    }

    verifyAdmin()
  }, [])

  const logout = () => {
    clearAuthSession()
    window.location.href = '/login'
  }

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center">Checking access...</div>
  }

  const addRestaurant = () => {
    const name = window.prompt('Enter restaurant name:')
    if (!name) return

    const next = {
      name,
      category: 'Other',
      rating: (4.3 + Math.random()).toFixed(1),
      status: 'Pending',
    }
    setRestaurants((prev) => [next, ...prev])
  }

  const editRestaurant = (index) => {
    const current = restaurants[index]
    const nextName = window.prompt('Edit restaurant name:', current.name)
    if (!nextName) return

    setRestaurants((prev) =>
      prev.map((r, i) => (i === index ? { ...r, name: nextName } : r)),
    )
  }

  const deleteRestaurant = (index) => {
    const target = restaurants[index]
    if (!window.confirm(`Delete ${target.name}?`)) return
    setRestaurants((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="flex">
        <aside className="w-72 bg-white border-r min-h-screen p-6">
          <a href="/" className="text-3xl font-bold tracking-tight">
            <span className="text-orange-500">Taste</span>
            <span className="text-emerald-600">Match</span>
          </a>
          <nav className="mt-10 space-y-2">
            <a className="block bg-orange-50 text-orange-600 px-4 py-3 rounded-3xl" href="/admin">
              Dashboard
            </a>
            <a className="block text-gray-700 px-4 py-3 rounded-3xl hover:bg-gray-100" href="#">
              Restaurants
            </a>
            <a className="block text-gray-700 px-4 py-3 rounded-3xl hover:bg-gray-100" href="#">
              Users
            </a>
            <a className="block text-gray-700 px-4 py-3 rounded-3xl hover:bg-gray-100" href="#">
              Reviews
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <header className="bg-white border rounded-3xl px-6 py-4 flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{session?.user?.fullName}</span>
              <button onClick={logout} className="text-sm text-orange-600 hover:text-orange-700">
                Logout
              </button>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              ['Total Users', '12,543', '+12.5%'],
              ['Restaurants', '324', '+8.2%'],
              ['Reviews', '8,942', '+15.3%'],
              ['Active Today', '1,234', '+5.7%'],
            ].map(([label, value, growth]) => (
              <article key={label} className="bg-white border rounded-3xl p-6">
                <div className="text-3xl font-semibold">{value}</div>
                <div className="text-gray-500 text-sm mt-1">{label}</div>
                <div className="text-emerald-500 text-sm mt-3">{growth}</div>
              </article>
            ))}
          </section>

          <section className="bg-white border rounded-3xl p-7">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-lg">Recent Restaurants</h2>
              <button
                onClick={addRestaurant}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-3xl text-sm"
              >
                Add New
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-3 text-left">Name</th>
                    <th className="py-3 text-left">Category</th>
                    <th className="py-3 text-left">Rating</th>
                    <th className="py-3 text-left">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((r, i) => (
                    <tr key={`${r.name}-${i}`} className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-4 font-medium">{r.name}</td>
                      <td className="py-4 text-gray-600">{r.category}</td>
                      <td className="py-4 text-orange-500">{r.rating}</td>
                      <td className="py-4">
                        <span
                          className={`px-4 py-1 rounded-full text-xs font-medium ${
                            r.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-4">
                        <button className="text-orange-500" onClick={() => editRestaurant(i)}>
                          Edit
                        </button>
                        <button className="text-red-500" onClick={() => deleteRestaurant(i)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
