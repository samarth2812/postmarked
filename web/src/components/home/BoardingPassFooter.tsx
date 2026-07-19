import './BoardingPassFooter.css'

export function BoardingPassFooter() {
  const linkedinUrl = 'https://www.linkedin.com/in/samarth-dhawan28/'

  return (
    <footer className="boarding-pass-footer-section">
      <div className="boarding-pass-card-wrapper">
        <a 
          href={linkedinUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="boarding-pass-link"
        >
          {/* Render the boarding pass SVG directly */}
          <div className="boarding-pass-image-container">
            <img 
              src="/assets/main-footer.svg" 
              alt="Boarding Pass" 
              className="boarding-pass-footer-image"
            />
          </div>
        
        </a>
      </div>
    </footer>
  )
}
