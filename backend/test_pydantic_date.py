from pydantic import BaseModel
from datetime import date
from typing import Optional

class T(BaseModel):
    d: Optional[date] = None

print(T(d='2026-07-04'))
print(T(d=date(2026,7,4)))
