export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import React, { useEffect, useState } from "react";
import clsx from "clsx";

// =============== Step 1: Subject + Date ===============
interface StepSubjectAndDateProps {
  subjects: { id: number; name: string }[];
  selectedSubjectId: number | null;
  setSelectedSubjectId: (id: number) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

function StepSubjectAndDate({
  subjects,
  selectedSubjectId,
  setSelectedSubjectId,
  selectedDate,
  setSelectedDate,
}: StepSubjectAndDateProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-semibold">Alege materia și ziua</h2>
      <p className="text-foreground-accent text-center max-w-md">
        Ce subiect te interesează cel mai mult și în ce zi dorești lecția demo?
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        {subjects.map((subj) => (
          <button
            key={subj.id}
            onClick={() => setSelectedSubjectId(subj.id)}
            className={clsx(
              "px-6 py-2 rounded-full border transition-colors",
              selectedSubjectId === subj.id
                ? "bg-primary text-black border-primary"
                : "bg-hero-background text-foreground-accent border-gray-300 hover:border-primary"
            )}
          >
            {subj.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <label className="text-lg font-medium">Alege data</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded focus:outline-none bg-hero-background text-foreground-accent 
                     hover:border-primary transition-colors"
        />
      </div>
    </div>
  );
}

// =============== Step 2: Teacher + Timeslot ===============
interface Teacher {
  id: number;
  name: string;
  subjectId: number;
}

interface StepTeacherTimeslotProps {
  teachers: Teacher[];
  selectedTeacherId: number | null;
  setSelectedTeacherId: (id: number) => void;
  selectedTimeslot: string;
  setSelectedTimeslot: (timeslot: string) => void;
}

function StepTeacherTimeslot({
  teachers,
  selectedTeacherId,
  setSelectedTeacherId,
  selectedTimeslot,
  setSelectedTimeslot,
}: StepTeacherTimeslotProps) {
  // Hardcoded timeslots
  const TIMESLOTS = ["16:00 - 17:30", "17:45 - 19:15", "19:30 - 21:00"];

  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-semibold">
        Alege profesorul și intervalul orar
      </h2>
      <p className="text-foreground-accent text-center max-w-md">
        Fiecare profesor poate avea până la 3 elevi într-o lecție demo. Dacă un
        interval este ocupat pentru un profesor, vom încerca să te redirecționăm
        la altul.
      </p>

      {/* Teacher selection */}
      <div>
        <p className="mb-2 text-lg font-medium text-center">
          Profesori disponibili:
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          {teachers.length > 0 ? (
            teachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacherId(teacher.id)}
                className={clsx(
                  "px-6 py-2 rounded-full border transition-colors",
                  selectedTeacherId === teacher.id
                    ? "bg-primary text-black border-primary"
                    : "bg-hero-background text-foreground-accent border-gray-300 hover:border-primary"
                )}
              >
                {teacher.name}
              </button>
            ))
          ) : (
            <p className="text-red-500">
              Niciun profesor disponibil pentru acest subiect.
            </p>
          )}
        </div>
      </div>

      {/* Timeslot selection */}
      <div>
        <p className="mb-2 text-lg font-medium text-center">
          Interval orar (între 16:00 și 21:00):
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          {TIMESLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTimeslot(slot)}
              className={clsx(
                "px-6 py-2 rounded-full border transition-colors",
                selectedTimeslot === slot
                  ? "bg-secondary text-white border-secondary"
                  : "bg-hero-background text-foreground-accent border-gray-300 hover:border-secondary"
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============== Step 3: Student Info ===============
interface StepStudentInfoProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
}

function StepStudentInfo({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
}: StepStudentInfoProps) {
  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold">Datele tale</h2>
      <p className="text-foreground-accent text-center">
        Completează informațiile de mai jos pentru a confirma lecția demo.
      </p>

      <div className="w-full space-y-3">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Nume complet
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="Ex: Andrei Popescu"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="Ex: andrei@example.com"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Telefon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Ex: 07xx xxx xxx"
          />
        </div>
      </div>
    </div>
  );
}

// =============== Step 4: Confirm ===============
interface StepConfirmProps {
  subjectId: number | null;
  teacherId: number | null;
  date: string;
  timeslot: string;
  name: string;
  email: string;
  phone: string;
  subjects: { id: number; name: string }[];
  teachers: { id: number; name: string }[];
  onSubmit: () => void;
}

function StepConfirm({
  subjectId,
  teacherId,
  date,
  timeslot,
  name,
  email,
  phone,
  subjects,
  teachers,
  onSubmit,
}: StepConfirmProps) {
  const subjectName =
    subjects.find((subj) => subj.id === subjectId)?.name || "N/A";

  const teacherName = teachers.find((t) => t.id === teacherId)?.name || "N/A";

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold">Confirmare finală</h2>
      <p className="text-foreground-accent text-center">
        Verifică încă o dată detaliile înainte de a finaliza programarea.
      </p>

      <div className="bg-hero-background p-6 rounded-xl w-full">
        <p className="mb-2">
          <span className="font-semibold">Materie:</span> {subjectName}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Profesor:</span> {teacherName}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Data aleasă:</span> {date || "N/A"}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Interval orar:</span> {timeslot}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Nume:</span> {name}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Email:</span> {email}
        </p>
        <p>
          <span className="font-semibold">Telefon:</span> {phone}
        </p>
      </div>

      <button
        onClick={onSubmit}
        className="bg-primary text-black font-semibold px-8 py-3 rounded-full hover:bg-primary-accent transition-colors"
      >
        Confirmă și Programează
      </button>
    </div>
  );
}

// =============== MAIN PAGE =============== //
export default function BookTrialPage() {
  // Current step (0 to 3)
  const [stepIndex, setStepIndex] = useState(0);

  // Subject state
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null
  );

  // Date state
  const [selectedDate, setSelectedDate] = useState("");

  // Teacher + Timeslot
  const [teachers, setTeachers] = useState<
    { id: number; name: string; subjectId: number }[]
  >([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null
  );
  const [selectedTimeslot, setSelectedTimeslot] = useState("");

  // Student info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Fetch subjects on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/subjects");
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects); // e.g. { subjects: [...] }
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    })();
  }, []);

  // Fetch teachers whenever subjectId changes
  useEffect(() => {
    if (!selectedSubjectId) return;
    (async () => {
      try {
        const res = await fetch(`/api/teachers?subjectId=${selectedSubjectId}`);
        if (res.ok) {
          const data = await res.json();
          setTeachers(data.teachers); // e.g. { teachers: [...] }
        } else {
          setTeachers([]);
        }
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setTeachers([]);
      }
    })();
  }, [selectedSubjectId]);

  // Wizard navigation
  const canGoNext = () => {
    // Step 0: need subject + date
    if (stepIndex === 0 && (!selectedSubjectId || !selectedDate)) return false;
    // Step 1: need teacher + timeslot
    if (stepIndex === 1 && (!selectedTeacherId || !selectedTimeslot))
      return false;
    // Step 2: need name + email
    if (stepIndex === 2 && (!name || !email)) return false;
    return true;
  };

  const goNext = () => {
    if (!canGoNext()) return;
    setStepIndex(stepIndex + 1);
  };
  const goBack = () => {
    setStepIndex(Math.max(0, stepIndex - 1));
  };

  // Final POST to /api/bookSlot
  const handleFinalSubmit = async () => {
    if (
      !selectedSubjectId ||
      !selectedTeacherId ||
      !selectedTimeslot ||
      !selectedDate ||
      !name ||
      !email
    ) {
      alert("Date incomplete. Verifică formularul.");
      return;
    }
    try {
      const response = await fetch("/api/bookSlot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          date: selectedDate,
          timeslot: selectedTimeslot,
          name,
          email,
          phone,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(
          `Eroare: ${errData.message || "Nu s-a putut finaliza programarea."}`
        );
        return;
      }

      alert("Lecția demo a fost programată cu succes!");
      // Optionally reset form or redirect to a "Mulțumim" page
    } catch (err) {
      console.error("Error final submit:", err);
      alert("A apărut o eroare. Încearcă din nou.");
    }
  };

  // Render step
  const renderStep = () => {
    switch (stepIndex) {
      case 0:
        return (
          <StepSubjectAndDate
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            setSelectedSubjectId={setSelectedSubjectId}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        );
      case 1:
        return (
          <StepTeacherTimeslot
            teachers={teachers}
            selectedTeacherId={selectedTeacherId}
            setSelectedTeacherId={setSelectedTeacherId}
            selectedTimeslot={selectedTimeslot}
            setSelectedTimeslot={setSelectedTimeslot}
          />
        );
      case 2:
        return (
          <StepStudentInfo
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
          />
        );
      case 3:
        return (
          <StepConfirm
            subjectId={selectedSubjectId}
            teacherId={selectedTeacherId}
            date={selectedDate}
            timeslot={selectedTimeslot}
            name={name}
            email={email}
            phone={phone}
            subjects={subjects}
            teachers={teachers}
            onSubmit={handleFinalSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-36 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
        Programează lecția demo
      </h1>

      {/* Render the current step */}
      {renderStep()}

      {/* Navigation (only show for Steps 0-2, because Step 3 has final confirmation button) */}
      {stepIndex < 3 && (
        <div className="flex items-center justify-between mt-10 max-w-md mx-auto w-full">
          {stepIndex > 0 ? (
            <button
              className="text-foreground-accent hover:text-foreground"
              onClick={goBack}
            >
              &larr; Înapoi
            </button>
          ) : (
            <span />
          )}

          <button
            onClick={goNext}
            disabled={!canGoNext()}
            className={clsx(
              "px-6 py-3 rounded-full font-semibold transition-colors",
              canGoNext()
                ? "bg-secondary text-white hover:bg-opacity-80"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {stepIndex === 2 ? "Continuă către confirmare" : "Următor →"}
          </button>
        </div>
      )}
    </div>
  );
}
