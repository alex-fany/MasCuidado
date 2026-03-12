export default function Card({children}) {
  return (
    <div className="bg-white/70
      shadow-lg 
      rounded-xl 
      p-4 sm:p-5 md:p-6 lg:p-8
      w-full 
      max-w-md sm:min-w-sm 
      mx-auto
      transition-all 
      duration-300
      hover:shadow-xl">
      {children}
    </div>
  )
}