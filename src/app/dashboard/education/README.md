# VestQuest Education Dashboard

This module contains the enhanced education dashboard for VestQuest, providing users with an interactive, personalized, and engaging learning experience for equity education.

## Key Features

### 1. Interactive Learning Elements
- Dynamic calculator tool for exploring equity scenarios
- Interactive quizzes to test knowledge and reinforce learning
- Decision simulation tool to practice real-world equity decisions
- Immediate feedback and explanations for enhanced learning

### 2. Personalized Learning Experience
- Content adapts to user's knowledge level (beginner, intermediate, advanced)
- Recommended content based on user's past interactions and profile
- Customized learning paths for different equity situations
- Progress tracking across sessions and devices

### 3. Structured Learning Paths
- Guided learning paths for different topics (options, vesting, taxes, etc.)
- Step-by-step modules with clear progression
- Achievement tracking and gamification elements
- Visual progress indicators

### 4. Rich Visualizations and Interactivity
- Charts and graphs to explain complex concepts
- Visual timelines for vesting schedules
- Tax implication visualizations
- Interactive sliders and controls for exploring scenarios

### 5. Contextual Learning
- Glossary integration with hover tooltips throughout the application
- Progressive disclosure to prevent information overload
- Contextual examples relevant to users' equity grants
- On-demand detailed explanations

### 6. Content Organization
- Modular content structure with search functionality
- Content tagging and filtering
- Bookmarking system for saving important content
- Completion tracking for measuring progress

### 7. Performance Optimizations
- Lazy loading of content
- Component-based architecture for efficiency
- Client-side caching where appropriate
- Suspense boundaries for improved loading experience

## Technical Implementation

### Components
- `Education.jsx` - Main education dashboard page
- `InteractiveEducation.jsx` - Interactive learning modules
- `ProgressiveDisclosure.jsx` - Progressive content disclosure
- `GlossaryItem.jsx` - Glossary term component
- `GlossaryTooltip.jsx` - Tooltip for glossary terms
- `EducationCard.jsx` - Content card component
- `UserProgressProvider.jsx` - Context provider for tracking progress
- `LazyLoadableContent.jsx` - Lazy loading container for content

### Utilities
- `glossary-utils.js` - Utilities for glossary integration
- `EducationContext.jsx` - Context for education level management

### Data Structure
- Glossary terms are stored in the `glossary_terms` table
- Education content is stored in the `education_content` table
- Learning paths are stored in the `learning_paths` table
- User progress is stored in the `user_education_progress` table

## Usage

The education dashboard is accessible at `/dashboard/education` and provides various tabs for different learning modalities:

1. **Interactive Learning** - Dynamic tools and simulations
2. **Learning Paths** - Guided learning experiences
3. **Equity Basics** - Core concepts and explanations
4. **Glossary** - Comprehensive term dictionary
5. **Decision Guides** - Step-by-step decision guidance

## Best Practices

- Keep content concise and focused
- Use progressive disclosure for complex topics
- Add visuals where appropriate
- Link related concepts
- Include interactive elements for engagement
- Add real-world examples for context
- Update content regularly to reflect latest information