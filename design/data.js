// Mockup data. Own playlists are real (youtube_catalog.json). Third-party lesson counts are
// placeholders: the React app reads every number from the API.
window.CATEGORIES = [
  { slug: "study-with-ayaz", name: "Study with Ayaz", icon: "pen", ink: "ayaz", count: 21, who: "Ayaz Khan, in Urdu and Hindi" },
  { slug: "python", name: "Python", icon: "terminal", ink: "python", count: 5, who: "Corey Schafer, Telusko, CodeWithHarry" },
  { slug: "backend-engineering", name: "Backend Engineering", icon: "server", ink: "backend", count: 6, who: "Corey Schafer, Tech With Tim, Dave Gray" },
  { slug: "frontend-engineering", name: "Frontend Engineering", icon: "layout", ink: "frontend", count: 5, who: "Net Ninja, Dave Gray, Chai aur Code" },
  { slug: "ai-and-machine-learning", name: "AI and Machine Learning", icon: "cpu", ink: "ai", count: 7, who: "Krish Naik, sentdex, freeCodeCamp" },
  { slug: "devops-and-cloud", name: "DevOps and Cloud", icon: "cloud", ink: "devops", count: 6, who: "TechWorld with Nana, Abhishek Veeramalla" },
  { slug: "data-structures-and-interviews", name: "Data Structures and Interviews", icon: "branch", ink: "dsa", count: 6, who: "Abdul Bari, Striver, Love Babbar" },
  { slug: "freelancing-and-career", name: "Freelancing and Career", icon: "briefcase", ink: "career", count: 3, who: "Fiverr and freelancing guides" },
];

const A = { name: "Study with Ayaz", initials: "SA", owner: true };
window.OWN = [
  { title: "50 Days of Python Programming challenge", short: "Python in 50 days", cat: "Python", ink: "ayaz", lessons: 50, lang: "Urdu/Hindi", level: "Beginner", by: A, progress: 14 },
  { title: "Java course for Android development", short: "Java for Android", cat: "Java", ink: "ayaz", lessons: 58, lang: "Urdu/Hindi", level: "Beginner", by: A },
  { title: "50 Days 50 Python Programs", short: "50 Python programs", cat: "Python", ink: "ayaz", lessons: 25, lang: "Urdu/Hindi", level: "Beginner", by: A },
  { title: "9th Class Computer full syllabus course with notes", short: "9th class computer", cat: "School", ink: "ayaz", lessons: 21, lang: "Urdu", level: "Beginner", by: A },
  { title: "Java Projects for beginners", short: "Java projects", cat: "Java", ink: "ayaz", lessons: 10, lang: "Urdu/Hindi", level: "Beginner", by: A },
  { title: "Python Programs, beginner to advanced", short: "Python programs", cat: "Python", ink: "ayaz", lessons: 31, lang: "Urdu/Hindi", level: "Intermediate", by: A },
];

const c = (name, initials) => ({ name, initials });
window.FEATURED = [
  { title: "Django Tutorials", short: "Django", cat: "Backend", ink: "backend", lessons: 17, lang: "English", level: "Beginner", by: c("Corey Schafer", "CS") },
  { title: "Full Modern React Tutorial", short: "Modern React", cat: "Frontend", ink: "frontend", lessons: 32, lang: "English", level: "Beginner", by: c("Net Ninja", "NN") },
  { title: "Complete Kubernetes Tutorial for Beginners", short: "Kubernetes", cat: "DevOps", ink: "devops", lessons: 14, lang: "English", level: "Intermediate", by: c("TechWorld with Nana", "TN") },
  { title: "Algorithms", short: "Algorithms", cat: "DSA", ink: "dsa", lessons: 85, lang: "English", level: "Intermediate", by: c("Abdul Bari", "AB") },
  { title: "Complete Machine Learning", short: "Machine learning", cat: "AI and ML", ink: "ai", lessons: 60, lang: "English", level: "Intermediate", by: c("Krish Naik", "KN") },
  { title: "Python Programming Beginner Tutorials", short: "Python basics", cat: "Python", ink: "python", lessons: 30, lang: "English", level: "Beginner", by: c("Corey Schafer", "CS") },
  { title: "React Login, Registration and Authentication", short: "React auth", cat: "Frontend", ink: "frontend", lessons: 12, lang: "English", level: "Intermediate", by: c("Dave Gray", "DG") },
  { title: "DevOps Zero to Hero", short: "DevOps zero to hero", cat: "DevOps", ink: "devops", lessons: 45, lang: "English", level: "Beginner", by: c("Abhishek Veeramalla", "AV") },
  { title: "Python Django Tutorials In Hindi", short: "Django in Hindi", cat: "Backend", ink: "backend", lessons: 26, lang: "Hindi", level: "Beginner", by: c("CodeWithHarry", "CH") },
  { title: "Docker Tutorial for Beginners", short: "Docker", cat: "DevOps", ink: "devops", lessons: 10, lang: "English", level: "Beginner", by: c("TechWorld with Nana", "TN") },
  { title: "A2Z DSA Course", short: "A2Z DSA", cat: "DSA", ink: "dsa", lessons: 120, lang: "English", level: "Advanced", by: c("take U forward", "TF") },
  { title: "Chai aur React", short: "Chai aur React", cat: "Frontend", ink: "frontend", lessons: 15, lang: "Hindi", level: "Beginner", by: c("Chai aur Code", "CC") },
];

window.card = function (x) {
  const prog = x.progress
    ? `<div class="card-progress" aria-label="${Math.round((x.progress / x.lessons) * 100)}% complete"><i style="width:${(x.progress / x.lessons) * 100}%"></i></div>`
    : "";
  return `<a class="card" href="course.html">
    <div class="cover ink-${x.ink}">
      <div class="cover-top"><span>${x.cat}</span><span>${x.lessons} lessons</span></div>
      <div class="cover-title">${x.short}</div>
    </div>
    ${prog}
    <div class="card-body">
      <div class="card-title">${x.title}</div>
      <div class="creator"><span class="avatar">${x.by.initials}</span>${x.by.owner ? "By Ayaz" : x.by.name}</div>
      <div class="meta">${x.lang} · ${x.level}</div>
    </div></a>`;
};
window.fill = function (sel, list) {
  document.querySelectorAll(sel).forEach((el) => (el.innerHTML = list.map(card).join("")));
};
