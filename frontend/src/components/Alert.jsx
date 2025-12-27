export default function Alert({ main, info, onClose, type }) {
  const isSuccess = type === "success";
  
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 bg-white inline-flex space-x-3 p-3 text-sm rounded border z-50 ${
      isSuccess 
        ? "border-green-200" 
        : "border-red-200"
    }`}>
      {/* Success Icon */}
      {isSuccess ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M16.5 8.31V9a7.5 7.5 0 1 1-4.447-6.855M16.5 3 9 10.508l-2.25-2.25"
            stroke="#22C55E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        /* Error Icon */
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 16.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM9 6v4.5"
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 12.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            fill="#EF4444"
          />
        </svg>
      )}

      <div>
        <h3 className={`font-medium ${
          isSuccess ? "text-green-700" : "text-red-700"
        }`}>
          {main}
        </h3>
        <p className={`${
          isSuccess ? "text-green-600" : "text-red-600"
        }`}>
          {info}
        </p>
      </div>

      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className={`cursor-pointer mb-auto hover:opacity-80 active:scale-95 transition ${
          isSuccess ? "text-green-400 hover:text-green-600" : "text-red-400 hover:text-red-600"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect 
            y="12.532" 
            width="17.498" 
            height="2.1" 
            rx="1.05" 
            transform="rotate(-45.74 0 12.532)" 
            fill="currentColor" 
            fillOpacity=".7"
          />
          <rect 
            x="12.531" 
            y="13.914" 
            width="17.498" 
            height="2.1" 
            rx="1.05" 
            transform="rotate(-135.74 12.531 13.914)" 
            fill="currentColor" 
            fillOpacity=".7"
          />
        </svg>
      </button>
    </div>
  );
}