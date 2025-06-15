import React from 'react'

interface FullButtonProps {
    action: () => void;
    name: string;
    color: string
}

const FullButton = ({action, name, color="blue"}: FullButtonProps) => {
  return (
    <button onClick={action} className={`w-full py-2 md:py-3 text-sm text-center px-4 ${color === "blue" ? "bg-primary" : "bg-[#F6B76F]"}  text-white rounded-md`}>
      {name}
    </button>
  )
}

export default FullButton