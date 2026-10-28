function sessionId(){let id=sessionStorage.getItem('mysterySessionId');if(!id){id=crypto.randomUUID();sessionStorage.setItem('mysterySessionId',id)}return id}
export async function api(path,options={}){
 let response;try{response=await fetch(`/api/v1${path}`,{...options,headers:{'Content-Type':'application/json','x-session-id':sessionId(),...(options.headers||{})}})}catch{throw new Error('Could not reach the case server. Check that the backend is running, then try again.')}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error?.message||'The request failed. Please try again.');
 return data;
}
export const getSessionId=sessionId;
