from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, timedelta
import json

from ..auth import get_current_user
from ...analytics.property_analytics import PropertyAnalytics
from ...analytics.tenant_analytics import TenantAnalytics
from ...analytics.financial_analytics import FinancialAnalytics
from ...analytics.maintenance_analytics import MaintenanceAnalytics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

class AnalyticsRequest(BaseModel):
    date_range: str = Field(..., description="Date range for analytics (e.g., '30d', '6m', '1y')")
    property_ids: Optional[List[str]] = Field(None, description="Specific property IDs to analyze")
    metrics: List[str] = Field(..., description="List of metrics to calculate")
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional filters")

class PropertyAnalyticsRequest(BaseModel):
    property_id: Optional[str] = Field(None, description="Specific property ID")
    date_range: str = Field("30d", description="Date range for analysis")
    include_predictions: bool = Field(False, description="Include predictive analytics")

class TenantAnalyticsRequest(BaseModel):
    tenant_id: Optional[str] = Field(None, description="Specific tenant ID")
    property_id: Optional[str] = Field(None, description="Property to analyze tenants for")
    date_range: str = Field("30d", description="Date range for analysis")
    segment_by: Optional[str] = Field(None, description="Segmentation criteria")

@router.get("/dashboard")
async def get_dashboard_analytics(
    date_range: str = Query("30d", description="Date range for dashboard"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get comprehensive dashboard analytics"""
    try:
        # Initialize analytics services
        property_analytics = PropertyAnalytics()
        tenant_analytics = TenantAnalytics() 
        financial_analytics = FinancialAnalytics()
        maintenance_analytics = MaintenanceAnalytics()
        
        # Get user's accessible properties
        user_properties = await _get_user_properties(current_user["id"])
        
        # Collect all analytics data
        dashboard_data = {
            "summary": await _get_summary_metrics(
                user_properties, date_range, current_user["id"]
            ),
            "property_performance": await property_analytics.get_property_performance(
                property_ids=user_properties,
                date_range=date_range
            ),
            "financial_overview": await financial_analytics.get_financial_overview(
                property_ids=user_properties,
                date_range=date_range
            ),
            "tenant_insights": await tenant_analytics.get_tenant_insights(
                property_ids=user_properties,
                date_range=date_range
            ),
            "maintenance_summary": await maintenance_analytics.get_maintenance_summary(
                property_ids=user_properties,
                date_range=date_range
            ),
            "trends": await _get_trend_analysis(
                user_properties, date_range, current_user["id"]
            ),
            "alerts": await _get_analytics_alerts(
                user_properties, current_user["id"]
            )
        }
        
        return {
            "dashboard": dashboard_data,
            "timestamp": datetime.utcnow().isoformat(),
            "date_range": date_range,
            "user_id": current_user["id"]
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve dashboard analytics"
        )

@router.post("/property")
async def get_property_analytics(
    request: PropertyAnalyticsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get detailed property analytics"""
    try:
        property_analytics = PropertyAnalytics()
        
        # Validate property access
        if request.property_id:
            await _validate_property_access(request.property_id, current_user["id"])
        
        analytics_data = {
            "occupancy_analytics": await property_analytics.get_occupancy_analytics(
                property_id=request.property_id,
                date_range=request.date_range
            ),
            "revenue_analytics": await property_analytics.get_revenue_analytics(
                property_id=request.property_id,
                date_range=request.date_range
            ),
            "market_comparison": await property_analytics.get_market_comparison(
                property_id=request.property_id
            ),
            "performance_metrics": await property_analytics.get_performance_metrics(
                property_id=request.property_id,
                date_range=request.date_range
            )
        }
        
        if request.include_predictions:
            analytics_data["predictions"] = await property_analytics.get_predictions(
                property_id=request.property_id
            )
        
        return {
            "property_analytics": analytics_data,
            "property_id": request.property_id,
            "date_range": request.date_range,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting property analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve property analytics"
        )

@router.post("/tenant")
async def get_tenant_analytics(
    request: TenantAnalyticsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get detailed tenant analytics"""
    try:
        tenant_analytics = TenantAnalytics()
        
        # Validate access
        if request.property_id:
            await _validate_property_access(request.property_id, current_user["id"])
        
        analytics_data = {
            "tenant_satisfaction": await tenant_analytics.get_satisfaction_metrics(
                property_id=request.property_id,
                tenant_id=request.tenant_id,
                date_range=request.date_range
            ),
            "retention_analysis": await tenant_analytics.get_retention_analysis(
                property_id=request.property_id,
                date_range=request.date_range
            ),
            "payment_behavior": await tenant_analytics.get_payment_behavior(
                property_id=request.property_id,
                tenant_id=request.tenant_id,
                date_range=request.date_range
            ),
            "maintenance_requests": await tenant_analytics.get_maintenance_patterns(
                property_id=request.property_id,
                tenant_id=request.tenant_id,
                date_range=request.date_range
            )
        }
        
        if request.segment_by:
            analytics_data["segmentation"] = await tenant_analytics.get_tenant_segmentation(
                property_id=request.property_id,
                segment_by=request.segment_by
            )
        
        return {
            "tenant_analytics": analytics_data,
            "property_id": request.property_id,
            "tenant_id": request.tenant_id,
            "date_range": request.date_range,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting tenant analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve tenant analytics"
        )

@router.get("/financial")
async def get_financial_analytics(
    date_range: str = Query("30d"),
    property_id: Optional[str] = Query(None),
    include_projections: bool = Query(False),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get financial analytics and reporting"""
    try:
        financial_analytics = FinancialAnalytics()
        
        # Validate property access if specified
        if property_id:
            await _validate_property_access(property_id, current_user["id"])
        
        # Get user's accessible properties
        user_properties = [property_id] if property_id else await _get_user_properties(current_user["id"])
        
        financial_data = {
            "revenue_analysis": await financial_analytics.get_revenue_analysis(
                property_ids=user_properties,
                date_range=date_range
            ),
            "expense_analysis": await financial_analytics.get_expense_analysis(
                property_ids=user_properties,
                date_range=date_range
            ),
            "cash_flow": await financial_analytics.get_cash_flow_analysis(
                property_ids=user_properties,
                date_range=date_range
            ),
            "roi_analysis": await financial_analytics.get_roi_analysis(
                property_ids=user_properties,
                date_range=date_range
            ),
            "budget_variance": await financial_analytics.get_budget_variance(
                property_ids=user_properties,
                date_range=date_range
            )
        }
        
        if include_projections:
            financial_data["projections"] = await financial_analytics.get_financial_projections(
                property_ids=user_properties
            )
        
        return {
            "financial_analytics": financial_data,
            "property_ids": user_properties,
            "date_range": date_range,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting financial analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve financial analytics"
        )

@router.get("/maintenance")
async def get_maintenance_analytics(
    date_range: str = Query("30d"),
    property_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get maintenance analytics and insights"""
    try:
        maintenance_analytics = MaintenanceAnalytics()
        
        # Validate property access if specified
        if property_id:
            await _validate_property_access(property_id, current_user["id"])
        
        # Get user's accessible properties
        user_properties = [property_id] if property_id else await _get_user_properties(current_user["id"])
        
        maintenance_data = {
            "request_analytics": await maintenance_analytics.get_request_analytics(
                property_ids=user_properties,
                date_range=date_range,
                category=category
            ),
            "cost_analysis": await maintenance_analytics.get_cost_analysis(
                property_ids=user_properties,
                date_range=date_range
            ),
            "response_times": await maintenance_analytics.get_response_time_analysis(
                property_ids=user_properties,
                date_range=date_range
            ),
            "vendor_performance": await maintenance_analytics.get_vendor_performance(
                property_ids=user_properties,
                date_range=date_range
            ),
            "preventive_insights": await maintenance_analytics.get_preventive_insights(
                property_ids=user_properties
            )
        }
        
        return {
            "maintenance_analytics": maintenance_data,
            "property_ids": user_properties,
            "date_range": date_range,
            "category": category,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting maintenance analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve maintenance analytics"
        )

@router.post("/custom")
async def get_custom_analytics(
    request: AnalyticsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get custom analytics based on specific metrics and filters"""
    try:
        # Validate property access
        user_properties = request.property_ids or await _get_user_properties(current_user["id"])
        for property_id in user_properties:
            await _validate_property_access(property_id, current_user["id"])
        
        # Initialize analytics services
        analytics_services = {
            "property": PropertyAnalytics(),
            "tenant": TenantAnalytics(),
            "financial": FinancialAnalytics(),
            "maintenance": MaintenanceAnalytics()
        }
        
        custom_results = {}
        
        # Process each requested metric
        for metric in request.metrics:
            metric_parts = metric.split(".")
            service_name = metric_parts[0]
            metric_name = metric_parts[1] if len(metric_parts) > 1 else metric
            
            if service_name in analytics_services:
                service = analytics_services[service_name]
                result = await service.calculate_custom_metric(
                    metric_name=metric_name,
                    property_ids=user_properties,
                    date_range=request.date_range,
                    filters=request.filters or {}
                )
                custom_results[metric] = result
        
        return {
            "custom_analytics": custom_results,
            "request": request.dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting custom analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve custom analytics"
        )

@router.get("/export")
async def export_analytics(
    format: str = Query("csv", description="Export format (csv, xlsx, pdf)"),
    report_type: str = Query("dashboard", description="Type of report to export"),
    date_range: str = Query("30d"),
    property_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Export analytics data in various formats"""
    try:
        # This would integrate with a reporting service
        # For now, return a placeholder response
        
        export_data = {
            "export_id": f"export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "format": format,
            "report_type": report_type,
            "date_range": date_range,
            "property_id": property_id,
            "status": "processing",
            "download_url": None,  # Will be populated when ready
            "estimated_completion": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        }
        
        return {
            "export": export_data,
            "message": "Export request submitted successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error exporting analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to export analytics"
        )

# Helper functions
async def _get_user_properties(user_id: str) -> List[str]:
    """Get list of properties accessible to user"""
    # Mock implementation - replace with actual property service call
    return ["property_1", "property_2", "property_3"]

async def _validate_property_access(property_id: str, user_id: str) -> bool:
    """Validate user has access to property"""
    # Mock implementation - replace with actual access control
    user_properties = await _get_user_properties(user_id)
    if property_id not in user_properties:
        raise HTTPException(
            status_code=403,
            detail="Access denied to specified property"
        )
    return True

async def _get_summary_metrics(property_ids: List[str], date_range: str, user_id: str) -> Dict[str, Any]:
    """Get high-level summary metrics"""
    # Mock implementation - replace with actual calculations
    return {
        "total_properties": len(property_ids),
        "total_units": 45,
        "occupancy_rate": 92.5,
        "monthly_revenue": 125000,
        "pending_maintenance": 8,
        "active_tenants": 42
    }

async def _get_trend_analysis(property_ids: List[str], date_range: str, user_id: str) -> Dict[str, Any]:
    """Get trend analysis data"""
    # Mock implementation - replace with actual trend calculations
    return {
        "occupancy_trend": "increasing",
        "revenue_trend": "stable", 
        "maintenance_trend": "decreasing",
        "tenant_satisfaction_trend": "increasing"
    }

async def _get_analytics_alerts(property_ids: List[str], user_id: str) -> List[Dict[str, Any]]:
    """Get analytics-based alerts and recommendations"""
    # Mock implementation - replace with actual alert logic
    return [
        {
            "type": "occupancy_alert",
            "severity": "medium",
            "message": "Occupancy rate below target in Property A",
            "property_id": "property_1",
            "action_recommended": "Review pricing strategy"
        },
        {
            "type": "maintenance_alert", 
            "severity": "high",
            "message": "High maintenance costs detected",
            "property_id": "property_2",
            "action_recommended": "Schedule preventive maintenance review"
        }
    ]