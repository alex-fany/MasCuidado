export default function GoogleButton({onClick}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 border rounded-lg py-2 w-full hover:bg-gray-100 shadow-lg"
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        className="w-5"
      />
      Continuar con Google
    </button>
  )
}