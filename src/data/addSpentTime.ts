import * as moment from 'moment';
import * as vscode from 'vscode';
import fetch from 'cross-fetch';
import { Issue } from '../Issue';

/**
 * Add Spent Time for the Given Issue Id
 */
export async function addSpentTime (context: vscode.ExtensionContext, issue: Issue): Promise<any> {
  // TODO: Type
  // Get YouTrack Extension Settings
  const host = vscode.workspace.getConfiguration('youtrack').get('host');
  const permanentToken = vscode.workspace.getConfiguration('youtrack').get('permanentToken');

  const currentIssue = issue || context.globalState.get('youtrackPinIssue');

  const issueId = currentIssue.id;
  const projectId = currentIssue.project.id;


  // Validate that the user has all required settings
  if (!host) {
    vscode.window.showErrorMessage('YouTrack: Missing host setting. Please configure extension settings.');
    return [];
  }
  if (!permanentToken) {
    vscode.window.showErrorMessage('YouTrack: Missing token. Please configure extension settings.');
    return [];
  }

  const workItemTypes = await fetch(`${host}api/admin/projects/${projectId}/timeTrackingSettings/workItemTypes?fields=id,name`, {
    headers: {
      Authorization: `Bearer ${permanentToken}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    // handle the response
    return response.json();
  }).catch((error) => {
    // handle the error
    console.log(error);
    return;
  });

  // Prompt the user to enter their work description
  const workDescription: string = await vscode.window.showInputBox({
    prompt: `Describe your work for Issue ${issueId}.`,
    ignoreFocusOut: true
  });

  // Prompt the user to enter their time spent
  const timeSpent: string = await vscode.window.showInputBox({
    prompt: `Enter the time spent for Issue ${issueId}. (1w=5d, 1d=8h)`,
    placeHolder: 'Enter valid duration syntax for time spent (For example: 1w 2d 4h)',
  });

  if (!timeSpent) {
    vscode.window.showWarningMessage('No value was provided for time spent.');
    return;
  }

  // Prompt the user to enter their work type
  const workType: any = await vscode.window.showQuickPick(
    workItemTypes.map((item) => ({ label: item.name, id: item.id })),
    { canPickMany: false, ignoreFocusOut: true, placeHolder: 'Select the type of your work' }
  );

  if (!workType) {
    vscode.window.showWarningMessage('No value was provided for work type.');
    return;
  }

  const url = `${host}api/issues/${issueId}/timeTracking/workItems?fields=id,$type,duration(minutes,presentation),type(id,name)`;
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${permanentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      duration: {
        $type: 'DurationValue',
        presentation: timeSpent,
      },
      type: {
        id: workType.id
      },
      text: workDescription,
      date: moment().valueOf(),
      usesMarkdown: true,
    }),
  };

  fetch(url, options)
    .then((response) => {
      // handle the response
      console.log(response.json());
      vscode.window.showInformationMessage(`Time added to issue ${issueId}`);
    })
    .catch((error) => {
      // handle the error
      console.log(error);
      vscode.window.showErrorMessage(`Failed to update issue!`);
    });

  // const workItem: SpentTime = await axios
  //   .post(
  //     `${host}api/issues/${issueId}/timeTracking/workItems?fields=id,$type,duration(minutes,presentation)`,
  //     {
  //       duration: {
  //         $type: 'DurationValue',
  //         presentation: timeSpent,
  //       },
  //       date: moment().valueOf(),
  //       usesMarkdown: true,
  //     },
  //     config
  //   )
  //   .then((response) => {
  //     if (response.data) {
  //       vscode.window.showInformationMessage(`Time added to issue ${issueId}`);
  //       return response.data;
  //     }
  //   })
  //   .catch((err) => {
  //     vscode.window.showErrorMessage(`Issue recording time: ${err.response.data.error_description}`);
  //     return;
  //   });

  // return workItem;
}
