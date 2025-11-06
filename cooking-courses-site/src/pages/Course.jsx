import { useParams } from 'react-router-dom'
import './Course.css'

const Course = () => {
  const { id } = useParams()

  return (
    <div className="course-page">
      <div className="container">
        <h1>Курс {id}</h1>
        <p>Страница курса в разработке...</p>
      </div>
    </div>
  )
}

export default Course



