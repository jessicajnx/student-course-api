const data = {
  students: [],
  courses: [],
  enrollments: [],
};

let studentId = 1;
let courseId = 1;

function list(collection) {
  return data[collection];
}

function get(collection, id) {
  return data[collection].find((item) => item.id === Number(id));
}

function create(collection, payload) {
  if (collection === "students") {
    // Vérifie l’unicité de l’email
    const exists = data.students.find((s) => s.email === payload.email);
    if (exists) {
      return { error: "Email must be unique" };
    }
  }

  const id = collection === "students" ? studentId++ : courseId++;
  const item = { id, ...payload };
  data[collection].push(item);
  return item;
}

function remove(collection, id) {
  if (collection === "courses") {
    // Selon les tests, la suppression doit fonctionner même si des étudiants sont inscrits
    // donc on ne bloque pas la suppression
  }

  const idx = data[collection].findIndex((it) => it.id === Number(id));
  if (idx === -1) return false;

  data[collection].splice(idx, 1);
  // Supprimer aussi les inscriptions liées à cet élément
  if (collection === "students") {
    data.enrollments = data.enrollments.filter((e) => e.studentId !== Number(id));
  } else if (collection === "courses") {
    data.enrollments = data.enrollments.filter((e) => e.courseId !== Number(id));
  }

  return true;
}

function enroll(studentId, courseId) {
  const course = get("courses", courseId);
  if (!course) return { error: "Course not found" };

  const student = get("students", studentId);
  if (!student) return { error: "Student not found" };

  const alreadyEnrolled = data.enrollments.some(
    (e) => e.studentId === Number(studentId) && e.courseId === Number(courseId)
  );
  if (alreadyEnrolled) return { error: "Student already enrolled in this course" };

  const enrolledCount = data.enrollments.filter((e) => e.courseId === Number(courseId)).length;
  data.enrollments.push({
    studentId: Number(studentId),
    courseId: Number(courseId),
  });
  return { success: true };
}

function unenroll(studentId, courseId) {
  const idx = data.enrollments.findIndex(
    (e) => e.studentId === Number(studentId) && e.courseId === Number(courseId)
  );
  if (idx === -1) return { error: "Enrollment not found" };
  data.enrollments.splice(idx, 1);
  return { success: true };
}

function getStudentCourses(studentId) {
  return data.enrollments
    .filter((e) => e.studentId === Number(studentId))
    .map((e) => get("courses", e.courseId));
}

function getCourseStudents(courseId) {
  return data.enrollments
    .filter((e) => e.courseId === Number(courseId))
    .map((e) => get("students", e.studentId));
}

function reset() {
  data.students = [];
  data.courses = [];
  data.enrollments = [];
  studentId = 1;
  courseId = 1;
}

function seed() {
  create("students", { name: "Alice", email: "alice@example.com" });
  create("students", { name: "Bob", email: "bob@example.com" });
  create("students", { name: "Charlie", email: "charlie@example.com" });
  create("courses", { title: "Math", teacher: "Mr. Smith" });
  create("courses", { title: "Physics", teacher: "Dr. Brown" });
  create("courses", { title: "History", teacher: "Ms. Clark" });
}

module.exports = {
  list,
  get,
  create,
  remove,
  reset,
  enroll,
  unenroll,
  getStudentCourses,
  getCourseStudents,
  seed,
};
