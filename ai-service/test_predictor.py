import unittest
import csv
from pathlib import Path

from predictor import load_artifacts, predict_priority


TEST_COMPLAINTS = [
    ("No water in hostel", "Water Supply", "CRITICAL"),
    ("Fan is not working in my room", "Electrical", "MEDIUM"),
    ("There is smoke coming from electrical board", "Electrical", "CRITICAL"),
    ("Mess food is not good", "Mess & Food", "LOW"),
    ("Internet is slow in hostel", "Wi-Fi & Internet", "MEDIUM"),
    ("Bathroom is dirty", "Bathroom & Cleaning", "MEDIUM"),
    ("Main gate security problem", "Security", "HIGH"),
    ("All hostel lights are not working", "Electrical", "HIGH"),
    ("One classroom projector is not working", "Classroom & Laboratory", "MEDIUM"),
    ("Gas smell is coming from hostel kitchen", "Mess & Food", "CRITICAL"),
    ("No running water for every student in the entire residence since morning", "Water Supply", "CRITICAL"),
    ("A tap is dripping in my room", "Water Supply", "LOW"),
    ("The fire exit is blocked in the academic building", "Security", "CRITICAL"),
    ("Several students are stranded because the college bus broke down", "Transport", "HIGH"),
    ("A broken chair in one classroom", "Maintenance", "LOW"),
    ("The hostel WiFi is unavailable for all residents", "Wi-Fi & Internet", "HIGH"),
    ("Sewage is overflowing in the shared hostel bathroom", "Bathroom & Cleaning", "CRITICAL"),
    ("The valid visitor pass is not scanning at the entrance", "Gate Pass", "MEDIUM"),
    ("A chemical spilled in the laboratory and students are nearby", "Security", "CRITICAL"),
    ("The library door hinge needs oiling", "Maintenance", "LOW"),
]


class PriorityPredictionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model_bundle, cls.vectorizer = load_artifacts()

    def test_representative_complaints(self):
        for complaint, expected_category, expected_priority in TEST_COMPLAINTS:
            with self.subTest(complaint=complaint):
                prediction = predict_priority(complaint, self.model_bundle, self.vectorizer)
                self.assertEqual(prediction["category"], expected_category)
                self.assertEqual(prediction["priority"], expected_priority)
                self.assertGreaterEqual(prediction["priorityScore"], 0)
                self.assertLessEqual(prediction["priorityScore"], 100)
                self.assertTrue(prediction["reason"])
                self.assertGreaterEqual(prediction["affectedPeople"], 1)

    def test_broad_water_outage_ranks_above_single_room_fan(self):
        water = predict_priority(
            "Water is not coming in our entire hostel since morning",
            self.model_bundle,
            self.vectorizer,
        )
        fan = predict_priority(
            "The fan in my hostel room is not working properly",
            self.model_bundle,
            self.vectorizer,
        )
        self.assertEqual(water["priority"], "CRITICAL")
        self.assertEqual(fan["priority"], "MEDIUM")
        self.assertEqual(fan["affectedPeople"], 1)
        self.assertGreater(water["priorityScore"], fan["priorityScore"])
        self.assertGreater(water["affectedPeople"], fan["affectedPeople"])
        self.assertEqual(fan["essentialServiceImpact"], 1)

    def test_training_dataset_has_varied_records_for_requested_campus_areas(self):
        dataset_path = Path(__file__).resolve().parent / "dataset" / "complaints.csv"
        with dataset_path.open(encoding="utf-8", newline="") as dataset_file:
            rows = list(csv.DictReader(dataset_file))

        self.assertGreaterEqual(len(rows), 100)
        self.assertTrue(all(row["complaint_text"].strip() for row in rows))
        self.assertTrue(all(row["category"] and row["severity"] and row["priority"] for row in rows))
        self.assertGreaterEqual(len({row["complaint_text"].lower() for row in rows}), 100)


if __name__ == "__main__":
    unittest.main()
