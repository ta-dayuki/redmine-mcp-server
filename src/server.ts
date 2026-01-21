#!/usr/bin/env node
/**
 * Custom MCP server that extends the generated server with file upload/download capabilities
 */

import {
  McpServer,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import packageJson from "../package.json" assert { type: "json" };

import { config } from "./config.js";

// Tool classification enum
enum ToolType {
  READ_ONLY = "read_only",
  WRITE = "write",
}

// Import generated handlers
import {
  addRelatedIssueHandler,
  addUserToGroupHandler,
  addWatcherHandler,
  archiveProjectHandler,
  closeProjectHandler,
  createFileHandler,
  createGroupHandler,
  createIssueCategoryHandler,
  createIssueHandler,
  createIssueRelationHandler,
  createMembershipHandler,
  createNewsHandler,
  createProjectHandler,
  createTimeEntryHandler,
  createUserHandler,
  createVersionHandler,
  deleteAttachmentHandler,
  deleteGroupHandler,
  deleteIssueCategoryHandler,
  deleteIssueHandler,
  deleteIssueRelationHandler,
  deleteMembershipHandler,
  deleteNewsHandler,
  deleteProjectHandler,
  deleteTimeEntryHandler,
  deleteUserHandler,
  deleteVersionHandler,
  deleteWikiPageHandler,
  getAttachmentHandler,
  getCurrentUserHandler,
  getCustomFieldsHandler,
  getDocumentCategoriesHandler,
  getFilesHandler,
  getGroupHandler,
  getGroupsHandler,
  getIssueCategoriesHandler,
  getIssueCategoryHandler,
  getIssueHandler,
  getIssuePrioritiesHandler,
  getIssueRelationHandler,
  getIssueRelationsHandler,
  getIssuesHandler,
  getIssueStatusesHandler,
  getMembershipHandler,
  getMembershipsHandler,
  getMyAccountHandler,
  getNewsHandler,
  getNewsListByProjectHandler,
  getNewsListHandler,
  getProjectHandler,
  getProjectsHandler,
  getQueriesHandler,
  getRoleHandler,
  getRolesHandler,
  getTimeEntriesHandler,
  getTimeEntryActivitiesHandler,
  getTimeEntryHandler,
  getTrackersHandler,
  getUserHandler,
  getUsersHandler,
  getVersionsByProjectHandler,
  getVersionsHandler,
  getWikiPageByVersionHandler,
  getWikiPageHandler,
  getWikiPagesHandler,
  removeRelatedIssueHandler,
  removeUserFromGroupHandler,
  removeWatcherHandler,
  reopenProjectHandler,
  searchHandler,
  unarchiveProjectHandler,
  updateAttachmentHandler,
  updateGroupHandler,
  updateIssueCategoryHandler,
  updateIssueHandler,
  updateJournalHandler,
  updateMembershipHandler,
  updateMyAccountHandler,
  updateNewsHandler,
  updateProjectHandler,
  updateTimeEntryHandler,
  updateUserHandler,
  updateVersionHandler,
  updateWikiPageHandler,
} from "./__generated__/handlers.js";

// Import generated schemas
import {
  AddRelatedIssueBody,
  AddRelatedIssueParams,
  AddUserToGroupBody,
  AddUserToGroupParams,
  AddWatcherBody,
  AddWatcherParams,
  ArchiveProjectParams,
  CloseProjectParams,
  CreateFileBody,
  CreateFileParams,
  CreateGroupBody,
  CreateGroupParams,
  CreateIssueBody,
  CreateIssueCategoryBody,
  CreateIssueCategoryParams,
  CreateIssueParams,
  CreateIssueRelationBody,
  CreateIssueRelationParams,
  CreateMembershipBody,
  CreateMembershipParams,
  CreateNewsBody,
  CreateNewsParams,
  CreateProjectBody,
  CreateProjectParams,
  CreateTimeEntryBody,
  CreateTimeEntryParams,
  CreateUserBody,
  CreateUserParams,
  CreateVersionBody,
  CreateVersionParams,
  DeleteAttachmentParams,
  DeleteGroupParams,
  DeleteIssueCategoryParams,
  DeleteIssueCategoryQueryParams,
  DeleteIssueParams,
  DeleteIssueRelationParams,
  DeleteMembershipParams,
  DeleteNewsParams,
  DeleteProjectParams,
  DeleteTimeEntryParams,
  DeleteUserParams,
  DeleteVersionParams,
  DeleteWikiPageParams,
  GetAttachmentParams,
  GetCurrentUserParams,
  GetCurrentUserQueryParams,
  GetCustomFieldsParams,
  GetDocumentCategoriesParams,
  GetFilesParams,
  GetGroupParams,
  GetGroupQueryParams,
  GetGroupsParams,
  GetIssueCategoriesParams,
  GetIssueCategoriesQueryParams,
  GetIssueCategoryParams,
  GetIssueParams,
  GetIssuePrioritiesParams,
  GetIssueQueryParams,
  GetIssueRelationParams,
  GetIssueRelationsParams,
  GetIssuesParams,
  GetIssuesQueryParams,
  GetIssueStatusesParams,
  GetMembershipParams,
  GetMembershipsParams,
  GetMembershipsQueryParams,
  GetMyAccountParams,
  GetNewsListByProjectParams,
  GetNewsListByProjectQueryParams,
  GetNewsListParams,
  GetNewsListQueryParams,
  GetNewsParams,
  GetNewsQueryParams,
  GetProjectParams,
  GetProjectQueryParams,
  GetProjectsParams,
  GetProjectsQueryParams,
  GetQueriesParams,
  GetQueriesQueryParams,
  GetRoleParams,
  GetRolesParams,
  GetTimeEntriesParams,
  GetTimeEntriesQueryParams,
  GetTimeEntryActivitiesParams,
  GetTimeEntryParams,
  GetTrackersParams,
  GetUserParams,
  GetUserQueryParams,
  GetUsersParams,
  GetUsersQueryParams,
  GetVersionsByProjectParams,
  GetVersionsByProjectQueryParams,
  GetVersionsParams,
  GetWikiPageByVersionParams,
  GetWikiPageByVersionQueryParams,
  GetWikiPageParams,
  GetWikiPageQueryParams,
  GetWikiPagesParams,
  RemoveRelatedIssueParams,
  RemoveUserFromGroupParams,
  RemoveWatcherParams,
  ReopenProjectParams,
  SearchParams,
  SearchQueryParams,
  UnarchiveProjectParams,
  UpdateAttachmentBody,
  UpdateAttachmentParams,
  UpdateGroupBody,
  UpdateGroupParams,
  UpdateIssueBody,
  UpdateIssueCategoryBody,
  UpdateIssueCategoryParams,
  UpdateIssueParams,
  UpdateJournalBody,
  UpdateJournalParams,
  UpdateMembershipBody,
  UpdateMembershipParams,
  UpdateMyAccountBody,
  UpdateMyAccountParams,
  UpdateNewsBody,
  UpdateNewsParams,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateTimeEntryBody,
  UpdateTimeEntryParams,
  UpdateUserBody,
  UpdateUserParams,
  UpdateVersionBody,
  UpdateVersionParams,
  UpdateWikiPageBody,
  UpdateWikiPageParams,
} from "./__generated__/tool-schemas.zod.js";

// Import custom attachment functionality
import { ZodRawShape } from "zod";
// Local file based handlers (existing)
import { downloadFileHandler } from "./attachment/download-to-local-file-handler.js";
import { downloadThumbnailHandler } from "./attachment/thumbnail-to-local-file-handler.js";
import { uploadFileHandler } from "./attachment/upload-local-file-handler.js";
// Base64 content based handlers (new)
import { downloadAsBase64ContentHandler } from "./attachment/download-as-base64-content-handler.js";
import { downloadThumbnailAsBase64ContentHandler } from "./attachment/thumbnail-as-base64-content-handler.js";
import { uploadBase64ContentHandler } from "./attachment/upload-base64-content-handler.js";
import {
  // Local file based schemas (existing)
  downloadToLocalFileParams,
  downloadThumbnailToLocalFileParams,
  uploadLocalFileParams,
  // Base64 content based schemas (new)
  downloadAsBase64ContentParams,
  downloadThumbnailAsBase64ContentParams,
  uploadBase64ContentParams,
} from "./schemas/attachment.js";

const server = new McpServer({
  name: "redmineAPIServer",
  version: packageJson.version,
});

// Track registered tools for statistics
const registeredTools = new Map<string, ToolType>();

/**
 * Helper function to conditionally register tools based on read-only mode
 */
const registerTool = <Args extends ZodRawShape>(
  toolName: string,
  description: string,
  toolType: ToolType,
  schemas: Args,
  handler: ToolCallback<Args>
) => {
  // Track tool registration for statistics
  registeredTools.set(toolName, toolType);

  if (config.readOnlyMode && toolType === ToolType.WRITE) {
    // Skip registration of write tools in read-only mode
    return;
  }
  server.tool(toolName, description, schemas, handler);
};

// Log server mode after all tools are registered
const logServerMode = () => {
  const readOnlyCount = Array.from(registeredTools.values()).filter(
    (t) => t === ToolType.READ_ONLY
  ).length;
  const writeCount = Array.from(registeredTools.values()).filter(
    (t) => t === ToolType.WRITE
  ).length;

  if (config.readOnlyMode) {
    console.error("Starting Redmine MCP Server in READ-ONLY mode");
    console.error(`Available tools: ${readOnlyCount} read-only operations`);
    console.error(`Disabled tools: ${writeCount} write operations`);
  } else {
    console.error("Starting Redmine MCP Server in FULL mode");
    console.error(`Available tools: ${readOnlyCount + writeCount} operations`);
  }
};

// Register all generated tools
registerTool(
  "getIssues",
  "List issues",
  ToolType.READ_ONLY,
  { pathParams: GetIssuesParams, queryParams: GetIssuesQueryParams },
  getIssuesHandler
);
registerTool(
  "createIssue",
  "Create issue",
  ToolType.WRITE,
  { pathParams: CreateIssueParams, bodyParams: CreateIssueBody },
  createIssueHandler
);
registerTool(
  "getIssue",
  "Show issue",
  ToolType.READ_ONLY,
  { pathParams: GetIssueParams, queryParams: GetIssueQueryParams },
  getIssueHandler
);
registerTool(
  "updateIssue",
  "Update issue",
  ToolType.WRITE,
  { pathParams: UpdateIssueParams, bodyParams: UpdateIssueBody },
  updateIssueHandler
);
registerTool(
  "deleteIssue",
  "Delete issue",
  ToolType.WRITE,
  { pathParams: DeleteIssueParams },
  deleteIssueHandler
);
registerTool(
  "addWatcher",
  "Add watcher",
  ToolType.WRITE,
  { pathParams: AddWatcherParams, bodyParams: AddWatcherBody },
  addWatcherHandler
);
registerTool(
  "removeWatcher",
  "Remove watcher",
  ToolType.WRITE,
  { pathParams: RemoveWatcherParams },
  removeWatcherHandler
);
registerTool(
  "getProjects",
  "List projects",
  ToolType.READ_ONLY,
  { pathParams: GetProjectsParams, queryParams: GetProjectsQueryParams },
  getProjectsHandler
);
registerTool(
  "createProject",
  "Create project",
  ToolType.WRITE,
  { pathParams: CreateProjectParams, bodyParams: CreateProjectBody },
  createProjectHandler
);
registerTool(
  "getProject",
  "Show project",
  ToolType.READ_ONLY,
  { pathParams: GetProjectParams, queryParams: GetProjectQueryParams },
  getProjectHandler
);
registerTool(
  "updateProject",
  "Update project",
  ToolType.WRITE,
  { pathParams: UpdateProjectParams, bodyParams: UpdateProjectBody },
  updateProjectHandler
);
registerTool(
  "deleteProject",
  "Delete project",
  ToolType.WRITE,
  { pathParams: DeleteProjectParams },
  deleteProjectHandler
);
registerTool(
  "archiveProject",
  "Archive project",
  ToolType.WRITE,
  { pathParams: ArchiveProjectParams },
  archiveProjectHandler
);
registerTool(
  "unarchiveProject",
  "Unarchive project",
  ToolType.WRITE,
  { pathParams: UnarchiveProjectParams },
  unarchiveProjectHandler
);
registerTool(
  "getMemberships",
  "List memberships",
  ToolType.READ_ONLY,
  { pathParams: GetMembershipsParams, queryParams: GetMembershipsQueryParams },
  getMembershipsHandler
);
registerTool(
  "createMembership",
  "Create membership",
  ToolType.WRITE,
  { pathParams: CreateMembershipParams, bodyParams: CreateMembershipBody },
  createMembershipHandler
);
registerTool(
  "getMembership",
  "Show membership",
  ToolType.READ_ONLY,
  { pathParams: GetMembershipParams },
  getMembershipHandler
);
registerTool(
  "updateMembership",
  "Update membership",
  ToolType.WRITE,
  { pathParams: UpdateMembershipParams, bodyParams: UpdateMembershipBody },
  updateMembershipHandler
);
registerTool(
  "deleteMembership",
  "Delete membership",
  ToolType.WRITE,
  { pathParams: DeleteMembershipParams },
  deleteMembershipHandler
);
registerTool(
  "closeProject",
  "Close project",
  ToolType.WRITE,
  { pathParams: CloseProjectParams },
  closeProjectHandler
);
registerTool(
  "reopenProject",
  "Reopen project",
  ToolType.WRITE,
  { pathParams: ReopenProjectParams },
  reopenProjectHandler
);
registerTool(
  "getUsers",
  "List users",
  ToolType.READ_ONLY,
  { pathParams: GetUsersParams, queryParams: GetUsersQueryParams },
  getUsersHandler
);
registerTool(
  "createUser",
  "Create user",
  ToolType.WRITE,
  { pathParams: CreateUserParams, bodyParams: CreateUserBody },
  createUserHandler
);
registerTool(
  "getUser",
  "Show user",
  ToolType.READ_ONLY,
  { pathParams: GetUserParams, queryParams: GetUserQueryParams },
  getUserHandler
);
registerTool(
  "updateUser",
  "Update user",
  ToolType.WRITE,
  { pathParams: UpdateUserParams, bodyParams: UpdateUserBody },
  updateUserHandler
);
registerTool(
  "deleteUser",
  "Delete user",
  ToolType.WRITE,
  { pathParams: DeleteUserParams },
  deleteUserHandler
);
registerTool(
  "getCurrentUser",
  "Show current user",
  ToolType.READ_ONLY,
  { pathParams: GetCurrentUserParams, queryParams: GetCurrentUserQueryParams },
  getCurrentUserHandler
);
registerTool(
  "getTimeEntries",
  "List time entries",
  ToolType.READ_ONLY,
  { pathParams: GetTimeEntriesParams, queryParams: GetTimeEntriesQueryParams },
  getTimeEntriesHandler
);
registerTool(
  "createTimeEntry",
  "Create time entry",
  ToolType.WRITE,
  { pathParams: CreateTimeEntryParams, bodyParams: CreateTimeEntryBody },
  createTimeEntryHandler
);
registerTool(
  "getTimeEntry",
  "Show time entry",
  ToolType.READ_ONLY,
  { pathParams: GetTimeEntryParams },
  getTimeEntryHandler
);
registerTool(
  "updateTimeEntry",
  "Update time entry",
  ToolType.WRITE,
  { pathParams: UpdateTimeEntryParams, bodyParams: UpdateTimeEntryBody },
  updateTimeEntryHandler
);
registerTool(
  "deleteTimeEntry",
  "Delete time entry",
  ToolType.WRITE,
  { pathParams: DeleteTimeEntryParams },
  deleteTimeEntryHandler
);
registerTool(
  "getNewsList",
  "List news",
  ToolType.READ_ONLY,
  { pathParams: GetNewsListParams, queryParams: GetNewsListQueryParams },
  getNewsListHandler
);
registerTool(
  "getNews",
  "Show news",
  ToolType.READ_ONLY,
  { pathParams: GetNewsParams, queryParams: GetNewsQueryParams },
  getNewsHandler
);
registerTool(
  "updateNews",
  "Update news",
  ToolType.WRITE,
  { pathParams: UpdateNewsParams, bodyParams: UpdateNewsBody },
  updateNewsHandler
);
registerTool(
  "deleteNews",
  "Delete news",
  ToolType.WRITE,
  { pathParams: DeleteNewsParams },
  deleteNewsHandler
);
registerTool(
  "getNewsListByProject",
  "List news by project",
  ToolType.READ_ONLY,
  {
    pathParams: GetNewsListByProjectParams,
    queryParams: GetNewsListByProjectQueryParams,
  },
  getNewsListByProjectHandler
);
registerTool(
  "createNews",
  "Create news",
  ToolType.WRITE,
  { pathParams: CreateNewsParams, bodyParams: CreateNewsBody },
  createNewsHandler
);
registerTool(
  "getIssueRelations",
  "List issue relations",
  ToolType.READ_ONLY,
  { pathParams: GetIssueRelationsParams },
  getIssueRelationsHandler
);
registerTool(
  "createIssueRelation",
  "Create issue relation",
  ToolType.WRITE,
  {
    pathParams: CreateIssueRelationParams,
    bodyParams: CreateIssueRelationBody,
  },
  createIssueRelationHandler
);
registerTool(
  "getIssueRelation",
  "Show issue relation",
  ToolType.READ_ONLY,
  { pathParams: GetIssueRelationParams },
  getIssueRelationHandler
);
registerTool(
  "deleteIssueRelation",
  "Delete issue relation",
  ToolType.WRITE,
  { pathParams: DeleteIssueRelationParams },
  deleteIssueRelationHandler
);
registerTool(
  "getVersionsByProject",
  "List versions by project",
  ToolType.READ_ONLY,
  {
    pathParams: GetVersionsByProjectParams,
    queryParams: GetVersionsByProjectQueryParams,
  },
  getVersionsByProjectHandler
);
registerTool(
  "createVersion",
  "Create version",
  ToolType.WRITE,
  { pathParams: CreateVersionParams, bodyParams: CreateVersionBody },
  createVersionHandler
);
registerTool(
  "getVersions",
  "Show version",
  ToolType.READ_ONLY,
  { pathParams: GetVersionsParams },
  getVersionsHandler
);
registerTool(
  "updateVersion",
  "Update version",
  ToolType.WRITE,
  { pathParams: UpdateVersionParams, bodyParams: UpdateVersionBody },
  updateVersionHandler
);
registerTool(
  "deleteVersion",
  "Delete version",
  ToolType.WRITE,
  { pathParams: DeleteVersionParams },
  deleteVersionHandler
);
registerTool(
  "getWikiPages",
  "List wiki pages",
  ToolType.READ_ONLY,
  { pathParams: GetWikiPagesParams },
  getWikiPagesHandler
);
registerTool(
  "getWikiPage",
  "Show wiki page",
  ToolType.READ_ONLY,
  { pathParams: GetWikiPageParams, queryParams: GetWikiPageQueryParams },
  getWikiPageHandler
);
registerTool(
  "updateWikiPage",
  "Create or update wiki page",
  ToolType.WRITE,
  { pathParams: UpdateWikiPageParams, bodyParams: UpdateWikiPageBody },
  updateWikiPageHandler
);
registerTool(
  "deleteWikiPage",
  "Delete wiki page",
  ToolType.WRITE,
  { pathParams: DeleteWikiPageParams },
  deleteWikiPageHandler
);
registerTool(
  "getWikiPageByVersion",
  "Show wiki page by specific version",
  ToolType.READ_ONLY,
  {
    pathParams: GetWikiPageByVersionParams,
    queryParams: GetWikiPageByVersionQueryParams,
  },
  getWikiPageByVersionHandler
);
registerTool(
  "getQueries",
  "List queries",
  ToolType.READ_ONLY,
  { pathParams: GetQueriesParams, queryParams: GetQueriesQueryParams },
  getQueriesHandler
);
registerTool(
  "getAttachment",
  "Show attachment",
  ToolType.READ_ONLY,
  { pathParams: GetAttachmentParams },
  getAttachmentHandler
);
registerTool(
  "updateAttachment",
  "Update attachment",
  ToolType.WRITE,
  { pathParams: UpdateAttachmentParams, bodyParams: UpdateAttachmentBody },
  updateAttachmentHandler
);
registerTool(
  "deleteAttachment",
  "Delete attachment",
  ToolType.WRITE,
  { pathParams: DeleteAttachmentParams },
  deleteAttachmentHandler
);
registerTool(
  "getIssueStatuses",
  "List issue statuses",
  ToolType.READ_ONLY,
  { pathParams: GetIssueStatusesParams },
  getIssueStatusesHandler
);
registerTool(
  "getTrackers",
  "List trackers",
  ToolType.READ_ONLY,
  { pathParams: GetTrackersParams },
  getTrackersHandler
);
registerTool(
  "getIssueCategories",
  "List issue categories",
  ToolType.READ_ONLY,
  {
    pathParams: GetIssueCategoriesParams,
    queryParams: GetIssueCategoriesQueryParams,
  },
  getIssueCategoriesHandler
);
registerTool(
  "createIssueCategory",
  "Create issue category",
  ToolType.WRITE,
  {
    pathParams: CreateIssueCategoryParams,
    bodyParams: CreateIssueCategoryBody,
  },
  createIssueCategoryHandler
);
registerTool(
  "getIssuePriorities",
  "List issue priorities",
  ToolType.READ_ONLY,
  { pathParams: GetIssuePrioritiesParams },
  getIssuePrioritiesHandler
);
registerTool(
  "getTimeEntryActivities",
  "List time entry activities",
  ToolType.READ_ONLY,
  { pathParams: GetTimeEntryActivitiesParams },
  getTimeEntryActivitiesHandler
);
registerTool(
  "getDocumentCategories",
  "List document categories",
  ToolType.READ_ONLY,
  { pathParams: GetDocumentCategoriesParams },
  getDocumentCategoriesHandler
);
registerTool(
  "getIssueCategory",
  "Show issue category",
  ToolType.READ_ONLY,
  { pathParams: GetIssueCategoryParams },
  getIssueCategoryHandler
);
registerTool(
  "updateIssueCategory",
  "Update issue category",
  ToolType.WRITE,
  {
    pathParams: UpdateIssueCategoryParams,
    bodyParams: UpdateIssueCategoryBody,
  },
  updateIssueCategoryHandler
);
registerTool(
  "deleteIssueCategory",
  "Delete issue category",
  ToolType.WRITE,
  {
    pathParams: DeleteIssueCategoryParams,
    queryParams: DeleteIssueCategoryQueryParams,
  },
  deleteIssueCategoryHandler
);
registerTool(
  "getRoles",
  "List roles",
  ToolType.READ_ONLY,
  { pathParams: GetRolesParams },
  getRolesHandler
);
registerTool(
  "getRole",
  "Show role",
  ToolType.READ_ONLY,
  { pathParams: GetRoleParams },
  getRoleHandler
);
registerTool(
  "getGroups",
  "List groups",
  ToolType.READ_ONLY,
  { pathParams: GetGroupsParams },
  getGroupsHandler
);
registerTool(
  "createGroup",
  "Create group",
  ToolType.WRITE,
  { pathParams: CreateGroupParams, bodyParams: CreateGroupBody },
  createGroupHandler
);
registerTool(
  "getGroup",
  "Show group",
  ToolType.READ_ONLY,
  { pathParams: GetGroupParams, queryParams: GetGroupQueryParams },
  getGroupHandler
);
registerTool(
  "updateGroup",
  "Update group",
  ToolType.WRITE,
  { pathParams: UpdateGroupParams, bodyParams: UpdateGroupBody },
  updateGroupHandler
);
registerTool(
  "deleteGroup",
  "Delete group",
  ToolType.WRITE,
  { pathParams: DeleteGroupParams },
  deleteGroupHandler
);
registerTool(
  "addUserToGroup",
  "Add user to group",
  ToolType.WRITE,
  { pathParams: AddUserToGroupParams, bodyParams: AddUserToGroupBody },
  addUserToGroupHandler
);
registerTool(
  "removeUserFromGroup",
  "Remove user from group",
  ToolType.WRITE,
  { pathParams: RemoveUserFromGroupParams },
  removeUserFromGroupHandler
);
registerTool(
  "getCustomFields",
  "List custom fields",
  ToolType.READ_ONLY,
  { pathParams: GetCustomFieldsParams },
  getCustomFieldsHandler
);
registerTool(
  "search",
  "Search",
  ToolType.READ_ONLY,
  { pathParams: SearchParams, queryParams: SearchQueryParams },
  searchHandler
);
registerTool(
  "getFiles",
  "List files",
  ToolType.READ_ONLY,
  { pathParams: GetFilesParams },
  getFilesHandler
);
registerTool(
  "createFile",
  "Create file",
  ToolType.WRITE,
  { pathParams: CreateFileParams, bodyParams: CreateFileBody },
  createFileHandler
);
registerTool(
  "getMyAccount",
  "Show my account",
  ToolType.READ_ONLY,
  { pathParams: GetMyAccountParams },
  getMyAccountHandler
);
registerTool(
  "updateMyAccount",
  "Update my account",
  ToolType.WRITE,
  { pathParams: UpdateMyAccountParams, bodyParams: UpdateMyAccountBody },
  updateMyAccountHandler
);
registerTool(
  "updateJournal",
  "Update journal",
  ToolType.WRITE,
  { pathParams: UpdateJournalParams, bodyParams: UpdateJournalBody },
  updateJournalHandler
);
registerTool(
  "addRelatedIssue",
  "Add related issue",
  ToolType.WRITE,
  { pathParams: AddRelatedIssueParams, bodyParams: AddRelatedIssueBody },
  addRelatedIssueHandler
);
registerTool(
  "removeRelatedIssue",
  "Remove related issue",
  ToolType.WRITE,
  { pathParams: RemoveRelatedIssueParams },
  removeRelatedIssueHandler
);

// Register custom attachment tools - Local file system based
registerTool(
  "uploadAttachmentFromLocalFile",
  "Upload attachment file from local file system to Redmine and get upload token",
  ToolType.WRITE,
  { pathParams: uploadLocalFileParams },
  uploadFileHandler
);
registerTool(
  "downloadAttachmentToLocalFile",
  "Download attachment file from Redmine to local file system",
  ToolType.READ_ONLY,
  { pathParams: downloadToLocalFileParams },
  downloadFileHandler
);
registerTool(
  "downloadThumbnailToLocalFile",
  "Download thumbnail from Redmine to local file system",
  ToolType.READ_ONLY,
  { pathParams: downloadThumbnailToLocalFileParams },
  downloadThumbnailHandler
);

// Register custom attachment tools - Base64 content based
registerTool(
  "uploadAttachmentFromBase64Content",
  "Upload attachment file from Base64 encoded content to Redmine and get upload token",
  ToolType.WRITE,
  { pathParams: uploadBase64ContentParams },
  uploadBase64ContentHandler
);
registerTool(
  "downloadAttachmentAsBase64Content",
  "Download attachment file from Redmine as Base64 encoded content",
  ToolType.READ_ONLY,
  { pathParams: downloadAsBase64ContentParams },
  downloadAsBase64ContentHandler
);
registerTool(
  "downloadThumbnailAsBase64Content",
  "Download thumbnail from Redmine as Base64 encoded content",
  ToolType.READ_ONLY,
  { pathParams: downloadThumbnailAsBase64ContentParams },
  downloadThumbnailAsBase64ContentHandler
);


// Log server mode after all tools are registered
logServerMode();

const transport = new StdioServerTransport();

server
  .connect(transport)
  .then(() => {
    console.error("MCP server running on stdio");
  })
  .catch(console.error);
