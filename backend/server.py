from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Union
import uuid
from datetime import datetime, date


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


class EntryBase(BaseModel):
    date: Optional[str] = None
    fecal_accidents: Optional[int] = None
    urine_accidents: Optional[int] = None
    leaks: Optional[bool] = None
    medication: Optional[Union[List[str], str]] = None
    medication_doses: Optional[dict] = None
    bm_type: Optional[str] = None
    bm_notes: Optional[str] = None
    poop_consistency: Optional[str] = None
    water_intake: Optional[float] = None
    fiber_intake: Optional[float] = None
    water_unit: Optional[str] = None
    fiber_unit: Optional[str] = None
    motility_foods: Optional[List[str]] = None
    clean_out: Optional[bool] = None
    clean_out_notes: Optional[str] = None
    timed_sits_completed: Optional[bool] = None
    activity_30_min: Optional[bool] = None
    notes: Optional[str] = None


class EntryCreate(EntryBase):
    pass


class EntryUpdate(BaseModel):
    date: Optional[str] = None
    fecal_accidents: Optional[int] = None
    urine_accidents: Optional[int] = None
    leaks: Optional[bool] = None
    medication: Optional[Union[List[str], str]] = None
    medication_doses: Optional[dict] = None
    bm_type: Optional[str] = None
    bm_notes: Optional[str] = None
    poop_consistency: Optional[str] = None
    water_intake: Optional[float] = None
    fiber_intake: Optional[float] = None
    water_unit: Optional[str] = None
    fiber_unit: Optional[str] = None
    motility_foods: Optional[List[str]] = None
    clean_out: Optional[bool] = None
    clean_out_notes: Optional[str] = None
    timed_sits_completed: Optional[bool] = None
    activity_30_min: Optional[bool] = None
    notes: Optional[str] = None


class Entry(EntryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find(
        {}, {"_id": 0, "id": 1, "client_name": 1, "timestamp": 1}
    ).to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


def entry_from_mongo(document: dict) -> Entry:
    document.pop("_id", None)
    return Entry(**document)


def normalize_date(value: Optional[str]) -> str:
    if value:
        return value
    return date.today().isoformat()


@api_router.post("/entries", response_model=Entry)
async def create_entry(payload: EntryCreate):
    entry_data = payload.model_dump()
    entry_data["date"] = normalize_date(entry_data.get("date"))
    entry = Entry(**entry_data)
    await db.entries.insert_one(entry.model_dump())
    return entry


@api_router.get("/entries", response_model=List[Entry])
async def list_entries():
    entries = await db.entries.find({}, {"_id": 0}).sort("date", -1).to_list(2000)
    return [entry_from_mongo(entry) for entry in entries]


@api_router.get("/entries/{entry_id}", response_model=Entry)
async def get_entry(entry_id: str):
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry_from_mongo(entry)


@api_router.put("/entries/{entry_id}", response_model=Entry)
async def update_entry(entry_id: str, payload: EntryUpdate):
    existing = await db.entries.find_one({"id": entry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    updates = payload.model_dump(exclude_unset=True)
    if "date" in updates:
        updates["date"] = normalize_date(updates.get("date"))
    updates["updated_at"] = datetime.utcnow()
    await db.entries.update_one({"id": entry_id}, {"$set": updates})
    updated = await db.entries.find_one({"id": entry_id})
    return entry_from_mongo(updated)


@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str):
    result = await db.entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
