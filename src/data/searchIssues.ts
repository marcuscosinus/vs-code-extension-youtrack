import * as vscode from 'vscode';
import axios from 'axios';
import { SearchIssue } from './searchIssuesModel';

/**
 * Given the YouTrack Extension Settings, returns an array of current issues.
 */
export async function searchIssues(
  context: vscode.ExtensionContext,
  query?: string,
  responseCount?: number
): Promise<SearchIssue[]> {
  // Get YouTrack Extension Settings
  const host = vscode.workspace.getConfiguration('youtrack').get('host');
  const permanentToken = vscode.workspace.getConfiguration('youtrack').get('permanentToken');
  const currentIssuesQuery = vscode.workspace.getConfiguration('youtrack').get('currentIssuesQuery');
  const maxResponseCount = vscode.workspace.getConfiguration('youtrack').get('currentIssuesMaxResponseCount');

  // Validate that the user has all required settings
  if (!host) {
    vscode.window.showErrorMessage('YouTrack: Missing host setting. Please configure extension settings.');
    return [];
  }
  if (!permanentToken) {
    vscode.window.showErrorMessage('YouTrack: Missing token. Please configure extension settings.');
    return [];
  }

  // Use the search query passed into the function, if nothing is passed in, use the currentIssuesQuery
  const searchQuery = query ? query : currentIssuesQuery;

  // Have a minimum for the response count from the user.
  const responseCountToFetch = responseCount ? responseCount : maxResponseCount;

  const config = {
    headers: { Authorization: `Bearer ${permanentToken}` },
  };

  const issues: Array<SearchIssue> = await axios
    .get(
      `${host}api/issues?fields=idReadable,project(id),summary,resolved,reporter(login,fullName),created,customFields(name,id,fieldType,value(id,name,login,fullName,ordinal))&$top=${responseCountToFetch}&query=${searchQuery}`,
      config
    )
    .then((response) => {
      if (response.data) {
        return response.data;
      }
    })
    .catch((err) => {
      return [];
    });

  return issues;
}
