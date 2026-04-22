import os
import json
import pandas as pd


class DataExporter:
    def __init__(self):
        self.output_dir = "data_mining"
        os.makedirs(self.output_dir, exist_ok=True)

    def to_csv(self, products, filename):
        path = os.path.join(self.output_dir, filename)
        pd.DataFrame(products).to_csv(path, index=False, encoding="utf-8")
        return path

    def to_json(self, products, filename):
        path = os.path.join(self.output_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        return path