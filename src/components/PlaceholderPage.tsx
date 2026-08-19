export default function PlaceholderPage({ title, desc, features }: { title: string; desc: string; features: string[] }) {
  return (
    <div>
      <h2 className="page-title">{title}</h2>
      <p className="page-desc">{desc}</p>
      <div className="card">
        <div className="text-center py-16">
          <h3 className="font-bold text-gray-700 text-lg mb-2">模块框架</h3>
          <p className="text-sm text-gray-400 mb-6">{title} — 待开发</p>
          <div className="text-left max-w-sm mx-auto space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
