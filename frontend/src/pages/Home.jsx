import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
          Flood &amp; Disaster Emergency Dispatch Platform
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
          Help Sri Lanka <span className="text-red-500">Recover</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          A real-time disaster relief coordination platform connecting those who need
          aid with those who can provide it — built for speed in times of crisis.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/request-aid"
            className="bg-red-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors shadow"
          >
            Request Aid
          </Link>
          <Link
            to="/donate"
            className="bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors shadow"
          >
            Donate / Volunteer
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Aid Requests', value: '—' },
          { label: 'Donations Pledged', value: '—' },
          { label: 'Volunteers Active', value: '—' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm"
          >
            <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
            <div className="text-sm font-medium text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
