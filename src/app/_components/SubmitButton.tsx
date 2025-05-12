'use client';

interface SubmitButtonProps {
  text: string;
  backgroundColor: string;
  hoverColor: string;
  disabled?: boolean;
}

export default function SubmitButton({ 
  text, 
  backgroundColor, 
  hoverColor, 
  disabled = false 
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full p-3 text-white font-medium rounded-md transition duration-300 ${
        disabled ? 'opacity-70 cursor-not-allowed' : ''
      }`}
      style={{
        backgroundColor: disabled ? '#a0a0a0' : backgroundColor
      }}
    >
      {text}
    </button>
  );
}