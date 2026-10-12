
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, "courses.json");

// Parse incoming JSON requests
app.use(express.json());

// Create the JSON file automatically if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

// Read courses from the JSON file
function readCourses() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// Save courses to the JSON file
function saveCourses(courses) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(courses, null, 2),
    "utf8"
  );
}

function getNextId(courses) {
  return courses.reduce(
    (max, course) => Math.max(max, course.id),
    0
  ) + 1;
}


// Validate course information
function validateCourse(body, partial = false) {
  const allowedFields = [
    "name",
    "description",
    "target_date",
    "status"
  ];

  const statuses = [
    "Not Started",
    "In Progress",
    "Completed"
  ];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }

  if (Object.keys(body).some(key => !allowedFields.includes(key))) {
    return "Unknown course field provided.";
  }

  if (!partial && allowedFields.some(key => body[key] === undefined)) {
    return "All four course fields are required.";
  }

  if (
    body.name !== undefined &&
    (typeof body.name !== "string" || !body.name.trim())
  ) {
    return "Course name must be a non-empty string.";
  }

  if (
    body.description !== undefined &&
    typeof body.description !== "string"
  ) {
    return "Description must be a string.";
  }

  if (
    body.status !== undefined &&
    !statuses.includes(body.status)
  ) {
    return "Status must be Not Started, In Progress, or Completed.";
  }

  if (body.target_date !== undefined) {
    if (
      typeof body.target_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.target_date)
    ) {
      return "Target date must use YYYY-MM-DD format.";
    }

    const date = new Date(`${body.target_date}T00:00:00Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== body.target_date
    ) {
      return "Please provide a valid calendar date.";
    }
  }

  return null;
}

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CodeCraftHub API!",
    endpoints: [
      "GET /api/courses",
      "GET /api/courses/stats",
      "GET /api/courses/search?q=python",
      "GET /api/courses/:id",
      "POST /api/courses",
      "PUT /api/courses/:id",
      "DELETE /api/courses/:id"
    ]
  });
});

// Get all courses
app.get("/api/courses", (req, res) => {
  res.json(readCourses());
});

// Get course statistics
app.get("/api/courses/stats", (req, res) => {
  const courses = readCourses();

  res.json({
    total: courses.length,
    not_started: courses.filter(c => c.status === "Not Started").length,
    in_progress: courses.filter(c => c.status === "In Progress").length,
    completed: courses.filter(c => c.status === "Completed").length
  });
});

// Search courses by name or description
app.get("/api/courses/search", (req, res) => {
  const query = req.query.q;

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      error: "Provide a search term using ?q=term."
    });
  }

  const term = query.trim().toLowerCase();

  const results = readCourses().filter(course =>
    course.name.toLowerCase().includes(term) ||
    course.description.toLowerCase().includes(term)
  );

  res.json(results);
});

// Get one course by ID
app.get("/api/courses/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid course ID." });
  }

  const course = readCourses().find(c => c.id === id);

  if (!course) {
    return res.status(404).json({ error: "Course not found." });
  }

  res.json(course);
});

// Create a course
app.post("/api/courses", (req, res) => {
  const error = validateCourse(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  const courses = readCourses();

  const course = {
    id: getNextId(courses),
    name: req.body.name.trim(),
    description: req.body.description.trim(),
    target_date: req.body.target_date,
    status: req.body.status,
    created_at: new Date().toISOString()
  };

  courses.push(course);
  saveCourses(courses);

  res.status(201).json(course);
});

// Update a course
app.put("/api/courses/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid course ID." });
  }

  const error = validateCourse(req.body, true);

  if (error) {
    return res.status(400).json({ error });
  }

  const courses = readCourses();
  const index = courses.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Course not found." });
  }

  const updated = { ...courses[index] };

  for (const field of [
    "name",
    "description",
    "target_date",
    "status"
  ]) {
    if (req.body[field] !== undefined) {
      updated[field] =
        field === "name" || field === "description"
          ? req.body[field].trim()
          : req.body[field];
    }
  }

  courses[index] = updated;
  saveCourses(courses);

  res.json(updated);
});

// Delete a course
app.delete("/api/courses/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid course ID." });
  }

  const courses = readCourses();
  const remaining = courses.filter(c => c.id !== id);

  if (remaining.length === courses.length) {
    return res.status(404).json({ error: "Course not found." });
  }

  saveCourses(remaining);

  res.json({ message: "Course deleted successfully." });
});

// Handle invalid JSON requests
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }

  next(err);
});

// Start the server
app.listen(PORT, () => {
  console.log(`CodeCraftHub is running at http://localhost:${PORT}`);
});
