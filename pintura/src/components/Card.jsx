export default function Card({children}) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
      {children}
    </div>
  )
}