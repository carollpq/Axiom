export function SubmittedConfirmation() {
  return (
    <div className="p-4">
      <div
        className="rounded-lg p-4 text-center"
        style={{
          background: 'rgba(143,188,143,0.08)',
          border: '1px solid rgba(143,188,143,0.3)',
        }}
      >
        <div className="text-[14px] text-[#8fbc8f] font-serif mb-1">
          Rebuttal Submitted
        </div>
        <div className="text-[11px] text-[#6a6050] font-serif">
          Your responses have been submitted. The editor will review them.
        </div>
      </div>
    </div>
  );
}
