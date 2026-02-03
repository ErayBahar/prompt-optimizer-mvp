import { buildUrl, requestJson } from './apiClient';

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  promptIds: string[]; // Array of history item IDs
}

interface ProjectsApiResponse {
  status: string;
  projects: Array<{
    id: string;
    name: string;
    promptIds: string[];
    createdAt: string;
    updatedAt: string;
  }>;
}

interface ProjectMutationResponse {
  status: string;
  message: string;
  projectID?: string;
}

const PROJECT_MAX_NAME_LENGTH = 60;

// Cache for projects to avoid repeated API calls
let projectsCache: Project[] | null = null;
let currentUserId: string | null = null;

/**
 * Set the current user ID for API calls
 */
export function setCurrentUserId(userId: string | null): void {
  if (currentUserId !== userId) {
    currentUserId = userId;
    projectsCache = null; // Clear cache when user changes
  }
}

/**
 * Clear projects cache
 */
export function clearProjectsCache(): void {
  projectsCache = null;
}

/**
 * Get all projects from Firebase via API
 */
export async function getProjects(): Promise<Project[]> {
  if (!currentUserId) {
    console.warn('No user ID set for projects');
    return [];
  }
  
  // Return cached if available
  if (projectsCache !== null) {
    return projectsCache;
  }
  
  try {
    const response = await requestJson<ProjectsApiResponse>(
      buildUrl(`/users/${currentUserId}/projects`)
    );
    
    if (response.status === 'success' && response.projects) {
      projectsCache = response.projects.map(p => ({
        id: p.id,
        name: p.name,
        promptIds: p.promptIds || [],
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
      return projectsCache;
    }
    return [];
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
}

/**
 * Get projects synchronously from cache (for components that need sync access)
 */
export function getProjectsSync(): Project[] {
  return projectsCache || [];
}

/**
 * Create a new project
 */
export async function createProject(name: string): Promise<{ success: boolean; error?: string; project?: Project }> {
  // Validation
  if (!name || name.trim() === '') {
    return { success: false, error: 'Project name cannot be empty.' };
  }
  
  if (name.length > PROJECT_MAX_NAME_LENGTH) {
    return { success: false, error: 'Project name is too long.' };
  }
  
  if (!currentUserId) {
    return { success: false, error: 'User not logged in.' };
  }
  
  try {
    const response = await requestJson<ProjectMutationResponse>(
      buildUrl(`/users/${currentUserId}/addProject`),
      {
        method: 'POST',
        body: JSON.stringify({ project_name: name.trim() }),
      }
    );
    
    if (response.status === 'success' && response.projectID) {
      const newProject: Project = {
        id: response.projectID,
        name: name.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        promptIds: [],
      };
      
      // Update cache
      if (projectsCache) {
        projectsCache.unshift(newProject);
      } else {
        projectsCache = [newProject];
      }
      
      return { success: true, project: newProject };
    }
    
    return { success: false, error: response.message || 'Failed to create project' };
  } catch (error) {
    console.error('Failed to create project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

/**
 * Update project name
 */
export async function renameProject(projectId: string, newName: string): Promise<{ success: boolean; error?: string }> {
  if (!newName || newName.trim() === '') {
    return { success: false, error: 'Project name cannot be empty.' };
  }
  
  if (newName.length > PROJECT_MAX_NAME_LENGTH) {
    return { success: false, error: 'Project name is too long.' };
  }
  
  if (!currentUserId) {
    return { success: false, error: 'User not logged in.' };
  }
  
  try {
    const response = await requestJson<ProjectMutationResponse>(
      buildUrl(`/users/${currentUserId}/projects/${projectId}`, { new_name: newName.trim() }),
      { method: 'PUT' }
    );
    
    if (response.status === 'success') {
      // Update cache
      if (projectsCache) {
        const project = projectsCache.find(p => p.id === projectId);
        if (project) {
          project.name = newName.trim();
          project.updatedAt = new Date();
        }
      }
      return { success: true };
    }
    
    return { success: false, error: response.message || 'Failed to rename project' };
  } catch (error) {
    console.error('Failed to rename project:', error);
    return { success: false, error: 'Failed to rename project' };
  }
}

/**
 * Delete a project (prompts remain in history)
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  if (!currentUserId) {
    return { success: false, error: 'User not logged in.' };
  }
  
  try {
    const response = await requestJson<ProjectMutationResponse>(
      buildUrl(`/users/${currentUserId}/projects/${projectId}`),
      { method: 'DELETE' }
    );
    
    if (response.status === 'success') {
      // Update cache
      if (projectsCache) {
        projectsCache = projectsCache.filter(p => p.id !== projectId);
      }
      return { success: true };
    }
    
    return { success: false, error: response.message || 'Failed to delete project' };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}

/**
 * Add a prompt to a project
 */
export async function addPromptToProject(projectId: string, promptId: string): Promise<{ success: boolean; error?: string }> {
  if (!currentUserId) {
    return { success: false, error: 'User not logged in.' };
  }
  
  try {
    const response = await requestJson<ProjectMutationResponse>(
      buildUrl(`/users/${currentUserId}/projects/${projectId}/prompts/${promptId}`),
      { method: 'POST' }
    );
    
    if (response.status === 'success') {
      // Update cache - remove from other projects and add to target
      if (projectsCache) {
        projectsCache.forEach(project => {
          project.promptIds = project.promptIds.filter(id => id !== promptId);
          if (project.id === projectId) {
            project.promptIds.push(promptId);
            project.updatedAt = new Date();
          }
        });
      }
      return { success: true };
    }
    
    return { success: false, error: response.message || 'Failed to add prompt to project' };
  } catch (error) {
    console.error('Failed to add prompt to project:', error);
    return { success: false, error: 'Failed to add prompt to project' };
  }
}

/**
 * Remove a prompt from a project (prompt stays in history)
 */
export async function removePromptFromProject(projectId: string, promptId: string): Promise<{ success: boolean; error?: string }> {
  if (!currentUserId) {
    return { success: false, error: 'User not logged in.' };
  }
  
  try {
    const response = await requestJson<ProjectMutationResponse>(
      buildUrl(`/users/${currentUserId}/projects/${projectId}/prompts/${promptId}`),
      { method: 'DELETE' }
    );
    
    if (response.status === 'success') {
      // Update cache
      if (projectsCache) {
        const project = projectsCache.find(p => p.id === projectId);
        if (project) {
          project.promptIds = project.promptIds.filter(id => id !== promptId);
          project.updatedAt = new Date();
        }
      }
      return { success: true };
    }
    
    return { success: false, error: response.message || 'Failed to remove prompt from project' };
  } catch (error) {
    console.error('Failed to remove prompt from project:', error);
    return { success: false, error: 'Failed to remove prompt from project' };
  }
}

/**
 * Move a prompt from one project to another
 */
export async function movePromptBetweenProjects(
  fromProjectId: string,
  toProjectId: string,
  promptId: string
): Promise<{ success: boolean; error?: string }> {
  // Simply add to the new project (backend will handle the move)
  return addPromptToProject(toProjectId, promptId);
}

/**
 * Get project by ID (from cache)
 */
export function getProjectById(projectId: string): Project | null {
  if (!projectsCache) return null;
  return projectsCache.find(p => p.id === projectId) || null;
}

/**
 * Get project for a specific prompt (from cache)
 */
export function getProjectForPrompt(promptId: string): Project | null {
  if (!projectsCache) return null;
  return projectsCache.find(p => p.promptIds.includes(promptId)) || null;
}

/**
 * Search projects by name (from cache)
 */
export function searchProjects(query: string): Project[] {
  if (!projectsCache) return [];
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) return projectsCache;
  
  return projectsCache.filter(p => p.name.toLowerCase().includes(lowerQuery));
}

export { PROJECT_MAX_NAME_LENGTH };
