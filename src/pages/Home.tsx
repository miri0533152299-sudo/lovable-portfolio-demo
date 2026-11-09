import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="intro">
      <h1>חללים שנבנים סביב האנשים שגרים בהם</h1>
      <p>סטודיו לעיצוב פנים ומיתוג לבתים, קליניקות ועסקים קטנים.</p>
      <p className="cta"><Link to="/projects">לכל הפרויקטים</Link></p>
    </section>
  );
}
