import { useEffect } from 'react'
import './ProjectModal.css'

const ProjectModal = ({ project, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !project) return null

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div className="project-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="project-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="project-modal-image">
          <div 
            className="project-modal-image-bg" 
            style={{ backgroundImage: `url(${project.image})` }}
          ></div>
        </div>
        <div className="project-modal-info">
          <span className="project-modal-category">{project.category}</span>
          <h2 className="project-modal-title">{project.title}</h2>
          <p className="project-modal-location">{project.location}</p>
          <div className="project-modal-description">
            <p>
              Детальное описание проекта будет здесь. Информация о концепции,
              используемых материалах, технологиях и уникальных решениях.
            </p>
            <p>
              Проект демонстрирует наш подход к архитектуре: функциональность,
              долговечность и эстетическая чистота в каждом решении.
            </p>
          </div>
          <div className="project-modal-specs">
            <div className="spec-item">
              <span className="spec-label">ПЛОЩАДЬ</span>
              <span className="spec-value">15 000 м²</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">ГОД</span>
              <span className="spec-value">2024</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">СТАТУС</span>
              <span className="spec-value">ЗАВЕРШЕН</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectModal

