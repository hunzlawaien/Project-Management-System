function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </h3>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">{description}</p>
    </div>
  );
}

export default StatCard;
