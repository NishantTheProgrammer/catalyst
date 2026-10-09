from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from models import Ticket

def get_tickets_eager(session: Session, processed_only: bool = False):
    """Fetch tickets with all AI analysis relationships eager-loaded to prevent N+1 queries."""
    stmt = select(Ticket)
    if processed_only:
        stmt = stmt.where(Ticket.is_processed == True)
        
    stmt = stmt.options(
        selectinload(Ticket.analysis),
        selectinload(Ticket.quality),
        selectinload(Ticket.bug_analysis)
    ).order_by(Ticket.id.desc())
    
    return session.exec(stmt).all()
