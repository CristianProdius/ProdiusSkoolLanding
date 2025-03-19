"use client";

import React, { useState } from "react";
import clsx from "clsx";

/**
 * 1) S T E P   D E F I N I T I O N
 * ---------------------------------
 * We'll define each step and a component function for each step’s UI.
 */

// Subjects you might offer:
const SUBJECTS = ["Matematică", "Română", "Biologie", "Chimie"];

// Example teachers, but you'll fetch real data from your DB later.
const TEACHERS = [
  { id: 1, name: "Prof. Popescu", subject: "Matematică" },
  { id: 2, name: "Prof. Ionescu", subject: "Matematică" },
  { id: 3, name: "Prof. Matei", subject: "Română" },
  { id: 4, name: "Prof. Radulescu", subject: "Română" },
  // etc.
];

// Hardcoded timeslots, e.g., 18:00–19:00 or 19:00–20:00
const TIMESLOTS = ["18:00 - 19:00", "19:00 - 20:00"];

/**
 * Step 1: Choose Subject
 */
function StepSubject({
  selectedSubject,
  setSelectedSubject,
}: {
  selectedSubject: string;
  setSelectedSubject: (val: string) => void;
}) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-2xl font-semibold">
        Alege materia pentru lecția demo
      </h2>
      <p className="text-foreground-accent text-center">
        Ce subiect te interesează cel mai mult? Alege una dintre opțiunile de
        mai jos.
      </p>

      <div className="flex flex-wrap gap-4 justify-center mt-5">
        {SUBJECTS.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={clsx(
              "px-6 py-2 rounded-full border transition-colors",
              selectedSubject === subj
                ? "bg-primary text-black border-primary"
                : "bg-hero-background text-foreground-accent border-gray-300 hover:border-primary"
            )}
          >
            {subj}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Step 2: Pick Teacher & Timeslot
 */
function StepTeacherTimeslot({
  selectedSubject,
  selectedTeacher,
  setSelectedTeacher,
  selectedTimeslot,
  setSelectedTimeslot,
}: {
  selectedSubject: string;
  selectedTeacher: number | null;
  setSelectedTeacher: (val: number) => void;
  selectedTimeslot: string;
  setSelectedTimeslot: (val: string) => void;
}) {
  // Filter teachers by subject
  const relevantTeachers = TEACHERS.filter(
    (t) => t.subject === selectedSubject
  );

  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-semibold">
        Alege profesorul și intervalul orar
      </h2>
      <p className="text-foreground-accent text-center max-w-md">
        Fiecare profesor poate avea până la 3 elevi într-o lecție demo. Dacă un
        interval este ocupat pentru un profesor, vom verifica celălalt.
      </p>

      {/* Teacher selection */}
      <div>
        <p className="mb-2 text-lg font-medium text-center">
          Profesori disponibili:
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          {relevantTeachers.length > 0 ? (
            relevantTeachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacher(teacher.id)}
                className={clsx(
                  "px-6 py-2 rounded-full border transition-colors",
                  selectedTeacher === teacher.id
                    ? "bg-primary text-black border-primary"
                    : "bg-hero-background text-foreground-accent border-gray-300 hover:border-primary"
                )}
              >
                {teacher.name}
              </button>
            ))
          ) : (
            <p className="text-red-500">
              Niciun profesor disponibil pentru {selectedSubject}.
            </p>
          )}
        </div>
      </div>

      {/* Timeslot selection */}
      <div>
        <p className="mb-2 text-lg font-medium text-center">
          Interval orar (între 18:00 și 20:00):
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

/**
 * Step 3: Student Info
 */
function StepStudentInfo({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
}: {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
}) {
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

/**
 * Step 4: Confirmation
 */
function StepConfirm({
  subject,
  teacher,
  timeslot,
  name,
  email,
  phone,
  onSubmit,
}: {
  subject: string;
  teacher: number | null;
  timeslot: string;
  name: string;
  email: string;
  phone: string;
  onSubmit: () => void;
}) {
  const teacherName = TEACHERS.find((t) => t.id === teacher)?.name || "N/A";

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold">Confirmare finală</h2>
      <p className="text-foreground-accent text-center">
        Verifică încă o dată detaliile înainte de a finaliza programarea.
      </p>

      <div className="bg-hero-background p-6 rounded-xl w-full">
        <p className="mb-2">
          <span className="font-semibold">Materie:</span> {subject}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Profesor:</span> {teacherName}
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

/**
 * 2) M A I N   C O M P O N E N T
 * ------------------------------
 * Puts the steps together in a wizard-like UI.
 */
export default function BookTrialPage() {
  // The current step index: 0=subject, 1=teacher/timeslot, 2=info, 3=confirm
  const [stepIndex, setStepIndex] = useState(0);

  // Form states
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Simple validations for each step (can be more thorough)
  const canGoNext = () => {
    if (stepIndex === 0 && selectedSubject === "") return false;
    if (stepIndex === 1 && (!selectedTeacher || selectedTimeslot === ""))
      return false;
    if (stepIndex === 2 && (!name || !email)) return false;
    // step 3 has the confirm button
    return true;
  };

  // Step forward (but only if valid)
  const goNext = () => {
    if (!canGoNext()) return;
    setStepIndex((prev) => prev + 1);
  };

  // Step backward
  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  // On final submit
  const handleFinalSubmit = () => {
    // THIS is where you'd implement your capacity checks, seat counting, etc.
    // For example, you'd call your API:
    //   await fetch("/api/bookSlot", { method: "POST", body: { subject, teacher, timeslot, name, email, phone } })
    // Then handle success / error, show a success message or redirect.

    alert("Lecția demo a fost programată cu succes!");
    // Optionally reset form or navigate to a "thank you" page.
  };

  // Render step
  const renderStep = () => {
    switch (stepIndex) {
      case 0:
        return (
          <StepSubject
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
          />
        );
      case 1:
        return (
          <StepTeacherTimeslot
            selectedSubject={selectedSubject}
            selectedTeacher={selectedTeacher}
            setSelectedTeacher={setSelectedTeacher}
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
            subject={selectedSubject}
            teacher={selectedTeacher}
            timeslot={selectedTimeslot}
            name={name}
            email={email}
            phone={phone}
            onSubmit={handleFinalSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-32 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
        Programează lecția demo
      </h1>

      {/* Render the current step */}
      {renderStep()}

      {/* Navigation buttons (except on final step) */}
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
