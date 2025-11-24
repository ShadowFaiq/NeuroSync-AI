"""
Crisis Detection Module for NeuroSync
Detects mental health crises from transcript text and calculates risk levels
"""

import re
from typing import Dict, List, Tuple

class CrisisDetector:
    """Advanced crisis detection with severity levels and detailed analysis"""
    
    def __init__(self):
        # Crisis keywords organized by severity
        self.severe_keywords = [
            'suicide', 'suicidal', 'kill myself', 'end my life', 'take my life',
            'want to die', 'better off dead', 'end it all', 'no point living',
            'not worth living', 'no reason to live', 'don\'t want to live',
            'plan to kill', 'planning to die', 'ready to die'
        ]
        
        self.high_risk_keywords = [
            'harm myself', 'hurt myself', 'self harm', 'cut myself',
            'overdose', 'can\'t go on', 'give up on life', 'hopeless',
            'no way out', 'trapped', 'unbearable', 'end the pain',
            'can\'t take it anymore', 'nothing matters', 'everyone better off without me'
        ]
        
        self.moderate_risk_keywords = [
            'hate myself', 'worthless', 'failure', 'burden',
            'can\'t cope', 'falling apart', 'losing control',
            'don\'t care anymore', 'numb', 'empty inside',
            'dark thoughts', 'intrusive thoughts'
        ]
        
        # Anxiety indicators
        self.anxiety_keywords = [
            'anxious', 'anxiety', 'worried', 'nervous', 'stressed',
            'overwhelmed', 'panic', 'panicking', 'racing thoughts',
            'can\'t breathe', 'heart racing', 'hyperventilating',
            'restless', 'on edge', 'tense', 'jittery', 'fear',
            'scared', 'terrified', 'dread', 'catastrophizing'
        ]
        
        # Depression indicators
        self.depression_keywords = [
            'depressed', 'depression', 'sad', 'hopeless', 'helpless',
            'empty', 'numb', 'no energy', 'exhausted', 'tired',
            'can\'t sleep', 'sleeping too much', 'no appetite',
            'don\'t enjoy', 'no interest', 'isolated', 'alone',
            'abandoned', 'worthless', 'guilty'
        ]
        
        # Protective phrases (reduce risk score)
        self.protective_phrases = [
            'getting help', 'seeing therapist', 'talking to doctor',
            'support system', 'family support', 'friends helping',
            'feeling better', 'improving', 'making progress',
            'hope', 'looking forward', 'trying'
        ]
    
    def detect_crisis(self, text: str) -> Dict:
        """
        Comprehensive crisis detection with severity levels
        
        Returns:
            {
                'crisis_detected': bool,
                'severity': 'none'|'low'|'moderate'|'high'|'severe',
                'risk_score': float (0.0-1.0),
                'matched_keywords': list,
                'recommended_action': str
            }
        """
        text_lower = text.lower()
        
        # Count matches by severity
        severe_matches = [kw for kw in self.severe_keywords if kw in text_lower]
        high_matches = [kw for kw in self.high_risk_keywords if kw in text_lower]
        moderate_matches = [kw for kw in self.moderate_risk_keywords if kw in text_lower]
        protective_matches = [phrase for phrase in self.protective_phrases if phrase in text_lower]
        
        # Calculate risk score
        risk_score = 0.0
        risk_score += len(severe_matches) * 0.4
        risk_score += len(high_matches) * 0.25
        risk_score += len(moderate_matches) * 0.1
        risk_score -= len(protective_matches) * 0.15  # Protective factors reduce risk
        
        # Cap at 1.0
        risk_score = max(0.0, min(1.0, risk_score))
        
        # Determine severity and action
        all_matches = severe_matches + high_matches + moderate_matches
        
        if severe_matches:
            severity = 'severe'
            crisis_detected = True
            action = 'IMMEDIATE: Contact emergency services (988/911) and notify all emergency contacts'
        elif high_matches or risk_score >= 0.6:
            severity = 'high'
            crisis_detected = True
            action = 'URGENT: Notify emergency contacts and encourage immediate professional help'
        elif moderate_matches or risk_score >= 0.3:
            severity = 'moderate'
            crisis_detected = True
            action = 'MODERATE: Encourage reaching out to therapist or support person'
        elif risk_score > 0:
            severity = 'low'
            crisis_detected = False
            action = 'MONITOR: Provide extra support and wellness resources'
        else:
            severity = 'none'
            crisis_detected = False
            action = 'Standard wellness plan'
        
        return {
            'crisis_detected': crisis_detected,
            'severity': severity,
            'risk_score': round(risk_score, 2),
            'matched_keywords': all_matches[:5],  # Top 5 for privacy
            'recommended_action': action,
            'protective_factors': len(protective_matches) > 0
        }
    
    def detect_anxiety(self, text: str) -> float:
        """
        Detect anxiety level from 0.0 (calm) to 1.0 (severe anxiety)
        
        Returns:
            float: Anxiety score
        """
        text_lower = text.lower()
        
        # Count anxiety keyword matches
        matches = sum(1 for keyword in self.anxiety_keywords if keyword in text_lower)
        
        # Look for intensity modifiers
        intensity_modifiers = ['very', 'extremely', 'really', 'so', 'unbearably', 'constantly']
        modifier_count = sum(1 for mod in intensity_modifiers if mod in text_lower)
        
        # Calculate score (0.0-1.0)
        base_score = min(matches / 8, 0.8)  # Max 0.8 from keywords
        modifier_boost = min(modifier_count / 10, 0.2)  # Additional 0.2 from intensity
        
        anxiety_score = min(base_score + modifier_boost, 1.0)
        
        return round(anxiety_score, 2)
    
    def detect_depression(self, text: str) -> float:
        """
        Detect depression indicators from 0.0 to 1.0
        
        Returns:
            float: Depression score
        """
        text_lower = text.lower()
        
        matches = sum(1 for keyword in self.depression_keywords if keyword in text_lower)
        
        # Calculate score
        depression_score = min(matches / 10, 1.0)
        
        return round(depression_score, 2)


# Global instance
crisis_detector = CrisisDetector()

# Convenience functions for backward compatibility
def detect_crisis(text: str) -> bool:
    """Simple boolean crisis detection for backward compatibility"""
    result = crisis_detector.detect_crisis(text)
    return result['crisis_detected']

def detect_anxiety(text: str) -> float:
    """Anxiety score for backward compatibility"""
    return crisis_detector.detect_anxiety(text)

def detect_depression(text: str) -> float:
    """Depression score (new function)"""
    return crisis_detector.detect_depression(text)
