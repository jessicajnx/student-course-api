const request = require("supertest");
const app = require("../../src/app");
const storage = require("../../src/services/storage");

describe("Student-Course API integration", () => {
  beforeEach(() => {
    require("../../src/services/storage").reset();
    require("../../src/services/storage").seed();
  });

  test("GET /students should return seeded students", async () => {
    const res = await request(app).get("/students");
    expect(res.statusCode).toBe(200);
    expect(res.body.students.length).toBe(3);
    expect(res.body.students[0].name).toBe("Alice");
  });

  test("POST /students should create a new student", async () => {
    const res = await request(app)
      .post("/students")
      .send({ name: "David", email: "david@example.com" });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("David");
  });

  test("POST /students should not allow duplicate email", async () => {
    const res = await request(app)
      .post("/students")
      .send({ name: "Eve", email: "alice@example.com" });
    expect(res.statusCode).toBe(201);
  });

  test("DELETE /courses/:id should delete a course even if students are enrolled", async () => {
    const courses = await request(app).get("/courses");
    const courseId = courses.body.courses[0].id;
    await request(app).post(`/courses/${courseId}/students/1`);
    const res = await request(app).delete(`/courses/${courseId}`);
    expect(res.statusCode).toBe(204);
  });
});

// nouveaux tests

// test 1 vérifie que l’API retourne 404 pour les routes inconnues (validé)
test("should return 404 for unknown routes", async () => {
  const res = await request(app).get("/route-qui-n-existe-pas");
  expect(res.statusCode).toBe(404);
  expect(res.body.error).toBe("Not Found");
});

// test 2 vérifie dans app.js que GET /courses/:id renvoie bien un cours avec les étudiants inscrits (validé)
test("GET /courses/:id should return course with enrolled students", async () => {
  const course = storage.list("courses")[0];
  const student = storage.list("students")[0];
  storage.enroll(student.id, course.id);
  const res = await request(app).get(`/courses/${course.id}`);
  expect(res.statusCode).toBe(200);
  expect(res.body.course.id).toBe(course.id);
  expect(res.body.students).toHaveLength(1);
  expect(res.body.students[0].id).toBe(student.id);
});

// test 3 vérifie dans app.js que GET /courses/:id renvoie 404 si le cours n’existe pas (validé)
test("GET /courses/:id should return 404 if course not found", async () => {
  const res = await request(app).get("/courses/9999");
  expect(res.statusCode).toBe(404);
  expect(res.body.error).toBe("Course not found");
});

// test 4 vérifie dans app.js que POST /courses crée un nouveau cours (validé)
test("POST /courses should create a new course", async () => {
  const res = await request(app).post("/courses").send({ title: "Biology", teacher: "Dr. Green" });
  expect(res.statusCode).toBe(201);
  expect(res.body.title).toBe("Biology");
  expect(res.body.teacher).toBe("Dr. Green");
  const courses = storage.list("courses");
  expect(courses.find((c) => c.title === "Biology")).toBeDefined();
});

// test 5 vérifie dans app.js que POST /courses renvoie 400 si le titre est manquant (validé)
test("POST /courses should return 400 if title is missing", async () => {
  const res = await request(app).post("/courses").send({ teacher: "Dr. Green" });
  expect(res.statusCode).toBe(400);
  expect(res.body.error).toBe("title and teacher required");
});

// test 6 vérifie dans app.js que POST /courses renvoie 400 si le teacher est manquant (validé)
test("POST /courses should return 400 if teacher is missing", async () => {
  const res = await request(app).post("/courses").send({ title: "Biology" });
  expect(res.statusCode).toBe(400);
  expect(res.body.error).toBe("title and teacher required");
});

// test 7 vérifie dans app.js que PUT /courses/:id met à jour le titre et le professeur du cours (validé)
test("PUT /courses/:id should update course title and teacher", async () => {
  const course = storage.list("courses")[0];
  const res = await request(app)
    .put(`/courses/${course.id}`)
    .send({ title: "Advanced Math", teacher: "Prof. White" });
  expect(res.statusCode).toBe(200);
  expect(res.body.title).toBe("Advanced Math");
  expect(res.body.teacher).toBe("Prof. White");
  const updatedCourse = storage.get("courses", course.id);
  expect(updatedCourse.title).toBe("Advanced Math");
  expect(updatedCourse.teacher).toBe("Prof. White");
});

// test 8 vérifie dans app.js que PUT /courses/:id renvoie 404 si le cours n’existe pas (validé)
test("PUT /courses/:id should return 404 if course does not exist", async () => {
  const res = await request(app)
    .put("/courses/999")
    .send({ title: "Nonexistent", teacher: "Nobody" });
  expect(res.statusCode).toBe(404);
  expect(res.body.error).toBe("Course not found");
});

// test 9 vérifie dans app.js que PUT /courses/:id renvoie 400 si le titre existe déjà (validé)
test("PUT /courses/:id should return 400 if title already exists", async () => {
  const course1 = storage.list("courses")[0];
  const course2 = storage.list("courses")[1];
  const res = await request(app).put(`/courses/${course2.id}`).send({ title: course1.title });
  expect(res.statusCode).toBe(400);
  expect(res.body.error).toBe("Course title must be unique");
});

// test 10 vérifie dans app.js que PUT /courses/:id met à jour uniquement le professeur si le titre n’est pas fourni (validé)
test("PUT /courses/:id should update only teacher if title not provided", async () => {
  const course = storage.list("courses")[0];
  const res = await request(app).put(`/courses/${course.id}`).send({ teacher: "Dr. NewTeacher" });
  expect(res.statusCode).toBe(200);
  expect(res.body.title).toBe(course.title);
  expect(res.body.teacher).toBe("Dr. NewTeacher");
});

// test 11 vérifie dans app.js que DELETE /courses/:id renvoie 404 si le cours n’existe pas (validé)
test("DELETE /courses/:id should return 404 if course does not exist", async () => {
  const res = await request(app).delete("/courses/999");
  expect(res.statusCode).toBe(404);
  expect(res.body.error).toBe("Course not found");
});

// test 12 vérifie dans app.js que DELETE /courses/:courseId/students/:studentId désinscrit un étudiant d’un cours (validé)
describe("DELETE /courses/:courseId/students/:studentId", () => {
  test("should unenroll a student successfully", async () => {
    const student = storage.list("students")[0];
    const course = storage.list("courses")[0];
    storage.enroll(student.id, course.id);
    const res = await request(app).delete(`/courses/${course.id}/students/${student.id}`);
    expect(res.statusCode).toBe(204);
  });

  test("should return 404 if the student is not enrolled", async () => {
    const student = storage.list("students")[0];
    const course = storage.list("courses")[0];
    const res = await request(app).delete(`/courses/${course.id}/students/${student.id}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Enrollment not found");
  });
});
