
import { useState } from "react";
import {
  createEmergency,
  uploadEmergencyEvidence,
} from "../services/emergencyService";
import "./EmergencyForm.css";

const emergencyTypes = [
  { value: "medical", label: "Medical Emergency" },
  { value: "fire", label: "Fire" },
  { value: "accident", label: "Accident" },
  { value: "electrical", label: "Electrical Hazard" },
  { value: "chemical", label: "Chemical Spill" },
  { value: "gas", label: "Gas Leak" },
  { value: "vehicle", label: "Vehicle Emergency" },
  { value: "equipment", label: "Equipment Failure" },
  { value: "security", label: "Security Threat" },
  { value: "other", label: "Other" },
];

function EmergencyForm({ onEmergencyCreated }) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const captureLocation = () => {
    setError("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLocationLoading(false);
      },
      (geoError) => {
        let message = "Unable to retrieve your location.";

        if (geoError.code === 1) {
          message =
            "Location permission denied. Please allow location access in your browser settings.";
        } else if (geoError.code === 2) {
          message = "Your location is currently unavailable.";
        } else if (geoError.code === 3) {
          message = "Location request timed out. Please try again.";
        }

        setError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const combinedFiles = [...files, ...selectedFiles];

    if (combinedFiles.length > 5) {
      setError("You can attach a maximum of 5 files.");
      event.target.value = "";
      return;
    }

    const invalidFile = combinedFiles.find(
      (file) =>
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
    );

    if (invalidFile) {
      setError("Only image and video files are allowed.");
      event.target.value = "";
      return;
    }

    setFiles(combinedFiles);
    setError("");
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!type) {
      setError("Please select an emergency type.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the emergency.");
      return;
    }

    if (!location) {
      setError("Please capture your current location.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createEmergency({
        type,
        description: description.trim(),
        location,
      });

      const emergency =
        result?.data?.emergency || result?.data;

      const emergencyId =
        emergency?._id || emergency?.id;

      if (!emergencyId && files.length > 0) {
        throw new Error(
          "Emergency was created, but its ID was not returned. Evidence could not be uploaded."
        );
      }

      if (files.length > 0) {
        await uploadEmergencyEvidence(emergencyId, files);
      }

setSuccess(
  "Your emergency has been recorded successfully. You can track its status under My Emergencies."
);
      setType("");
      setDescription("");
      setLocation(null);
      setFiles([]);

      if (onEmergencyCreated) {
        onEmergencyCreated();
      }
    } catch (submitError) {
      const message =
        submitError.response?.data?.message ||
        submitError.message ||
        "Failed to submit emergency. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="emergency-form-card">
      <div className="emergency-form-heading">
        <div>
          <h2>Emergency Details</h2>
          <p>
            Provide accurate information so your response team
            can assist you.
          </p>
        </div>

        <span className="emergency-required">
          * Required fields
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="emergency-field">
          <label htmlFor="emergency-type">
            Emergency Type <span>*</span>
          </label>

          <select
            id="emergency-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            required
          >
            <option value="">Select emergency type</option>

            {emergencyTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="emergency-field">
          <label htmlFor="emergency-description">
            Description <span>*</span>
          </label>

          <textarea
            id="emergency-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe what happened, where it happened, and whether anyone needs immediate assistance..."
            rows={5}
            maxLength={2000}
            required
          />

          <div className="emergency-character-count">
            {description.length}/2000 characters
          </div>
        </div>

        <div className="emergency-field">
          <label>Current Location <span>*</span></label>

          <div className="emergency-location-box">
            {location ? (
              <div className="location-details">
                <span className="location-status">
                  Location captured
                </span>

                <span>
                  Latitude: {location.latitude.toFixed(6)}
                </span>

                <span>
                  Longitude: {location.longitude.toFixed(6)}
                </span>

                <span>
                  Accuracy: approximately{" "}
                  {Math.round(location.accuracy)} metres
                </span>
              </div>
            ) : (
              <p>
                Your GPS location is required to submit an
                emergency report.
              </p>
            )}

            <button
              type="button"
              className="location-button"
              onClick={captureLocation}
              disabled={locationLoading || submitting}
            >
              {locationLoading
                ? "Capturing location..."
                : location
                  ? "Refresh Location"
                  : "Capture My Location"}
            </button>
          </div>
        </div>

        <div className="emergency-field">
          <label htmlFor="emergency-evidence">
            Photo / Video Evidence
          </label>

          <p className="emergency-field-hint">
            Attach up to 5 images or videos. Evidence is optional.
          </p>

          <input
            id="emergency-evidence"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            disabled={submitting || files.length >= 5}
          />

          {files.length > 0 && (
            <div className="emergency-file-list">
              {files.map((file, index) => (
                <div
                  className="emergency-file-item"
                  key={`${file.name}-${index}`}
                >
                  <span>{file.name}</span>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={submitting}
                    aria-label={`Remove ${file.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="emergency-message error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            className="emergency-message success"
            role="status"
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          className="emergency-submit-button"
          disabled={submitting}
        >
          {submitting
            ? "Submitting Emergency..."
            : "Submit Emergency"}
        </button>
      </form>
    </div>
  );
}

export default EmergencyForm;