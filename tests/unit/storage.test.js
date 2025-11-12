const storage = require("../../src/services/storage");
const studentsController = require("../../src/controllers/studentsController");

beforeEach(() => {
  storage.reset();
  storage.seed();
});

// droit à l'erreur : un cours peut avoir le même titre
test("should allow duplicate course title", () => {
  const result = storage.create("courses", {
    title: "Math",
    teacher: "Someone",
  });
  expect(result.title).toBe("Math");
});

// tests unitaires pour le service de stockage des étudiants
test("should list seeded students", () => {
  const students = storage.list("students");
  expect(students.length).toBe(3);
  expect(students[0].name).toBe("Alice");
});

// test de création d'un étudiant
test("should create a new student", () => {
  const result = storage.create("students", {
    name: "David",
    email: "david@example.com",
  });
  expect(result.name).toBe("David");
  expect(storage.list("students").length).toBe(4);
});

// email unique pour les étudiants
test("should not allow duplicate student email", () => {
  const result = storage.create("students", {
    name: "Eve",
    email: "alice@example.com",
  });
  expect(result.error).toBe("Email must be unique");
});

// test de suppression d'un étudiant
test("should delete a student", () => {
  const students = storage.list("students");
  const result = storage.remove("students", students[0].id);
  expect(result).toBe(true);
});

// un cours peut avoir plus de 3 étudiants inscrits (validé)
test("should allow more than 3 students in a course", () => {
  const students = storage.list("students");
  const course = storage.list("courses")[0];
  storage.create("students", { name: "Extra", email: "extra@example.com" });
  storage.create("students", { name:  "Extra2", email: "extra2@example.com" });
  storage.enroll(students[0].id, course.id);
  storage.enroll(students[1].id, course.id);
  storage.enroll(students[2].id, course.id);
  const result = storage.enroll(4, course.id);
  expect(result.success).toBe(true);
});

// nouveaux test

// test 1 : un etudiant ne peut pas s'inscrire deux fois au meme cours (validé)
test("enroll returns error if student is already enrolled", () => {
  const student = storage.list("students")[0];
  const course = storage.list("courses")[0];

  storage.enroll(Number(student.id), Number(course.id));
  const result = storage.enroll(Number(student.id), Number(course.id));
  expect(result.error).toBe("Student already enrolled in this course");
});

// test 2 : erreur de désinscription si l'inscription n'existe pas (validé)
test("unenroll returns error if enrollment does not exist", () => {
  const result = storage.unenroll(999, 888); // IDs inexistants
  expect(result.error).toBe("Enrollment not found");
});

// test 3 : désinscription réussie (validé)
test("unenroll removes an existing enrollment", () => {
  const student = storage.list("students")[0];
  const course = storage.list("courses")[0];

  storage.enroll(student.id, course.id);

  const result = storage.unenroll(student.id, course.id);
  expect(result.success).toBe(true);
});

// test 4 : getStudentCourses retourne tous les cours d'un étudiant (validé)
test("getStudentCourses returns all courses for a student", () => {
  const student = storage.list("students")[0];
  const courses = storage.list("courses");

  storage.enroll(student.id, courses[0].id);
  storage.enroll(student.id, courses[1].id);

  const studentCourses = storage.getStudentCourses(student.id);
  expect(studentCourses.length).toBe(2);
  expect(studentCourses.map((c) => c.id)).toEqual(
    expect.arrayContaining([courses[0].id, courses[1].id])
  );
});

// test 5 vérifie dans studentsController.js que getStudent renvoie bien un étudiant et ses cours (validé)
test("getStudent returns a student with their courses", () => {
  const student = storage.list("students")[0];
  const course = storage.list("courses")[0];
  storage.enroll(student.id, course.id);
  const req = { params: { id: student.id } };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  studentsController.getStudent(req, res);
  expect(res.json).toHaveBeenCalledWith({
    student,
    courses: [course],
  });
});

// test 6 vérifie dans studentsController.js que getStudent renvoie 404 si l’étudiant n’existe pas. (validé)
test("getStudent returns 404 if student not found", () => {
  const req = { params: { id: 999 } };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  studentsController.getStudent(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ error: "Student not found" });
});

// test 7 vérifie dans studentsController.js que deleteStudent supprime bien un étudiant (validé)
test("deleteStudent successfully deletes a student", () => {
  const student = storage.list("students")[0];
  const req = { params: { id: student.id } };
  const res = {
    send: jest.fn(),
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  studentsController.deleteStudent(req, res);
  expect(res.send).toHaveBeenCalled();
  expect(storage.list("students").find((s) => s.id === student.id)).toBeUndefined();
});

// test 8 vérifie dans studentsController.js que deleteStudent renvoie 404 si l’étudiant n’existe pas. (validé)
test("deleteStudent returns 404 if student not found", () => {
  const req = { params: { id: 999 } };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  studentsController.deleteStudent(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ error: "Student not found" });
});

// test 9 vérifie dans studentsController.js que updateStudent met à jour correctement le nom et l’email (validé)
test("updateStudent successfully updates name and email", () => {
  const student = storage.list("students")[0];
  const req = {
    params: { id: student.id },
    body: { name: "Updated Name", email: "updated@example.com" },
  };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  studentsController.updateStudent(req, res);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      id: student.id,
      name: "Updated Name",
      email: "updated@example.com",
    })
  );
});

// test 10 vérifie dans studentsController.js que updateStudent renvoie 404 si l’étudiant n’existe pas (validé)
test("updateStudent returns 404 if student not found", () => {
  const req = { params: { id: 999 }, body: { name: "Name" } };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  studentsController.updateStudent(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ error: "Student not found" });
});

// test 11 vérifie dans studentsController.js que updateStudent renvoie 400 si l’email est en double (validé)
test("updateStudent returns 400 if email is duplicate", () => {
  const students = storage.list("students");
  const student1 = students[0];
  const student2 = students[1];
  const req = {
    params: { id: student2.id },
    body: { email: student1.email },
  };
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  studentsController.updateStudent(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Email must be unique" });
});

// test 12 vérifie dans studentsController.js que createStudent renvoie 400 si le nom est manquant (validé)
test("createStudent returns 400 if name is missing", () => {
  const req = { body: { email: "new@example.com" } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  studentsController.createStudent(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "name and email required" });
});

// test 13 vérifie dans studentsController.js que createStudent renvoie 400 si l’email est manquant (validé)
test("createStudent returns 400 if email is missing", () => {
  const req = { body: { name: "New Student" } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  studentsController.createStudent(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "name and email required" });
});
