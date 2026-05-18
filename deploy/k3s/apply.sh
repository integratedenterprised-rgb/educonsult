#!/usr/bin/env bash
# Apply the aeroabroad k3s manifests. Resolves the node IP automatically so
# the manual EndpointSlice can route Service → host:3001 (where the
# docker-compose `app` is loopback-bound).
#
# Run from /opt/aeroabroad on the VPS after `bash deploy/deploy.sh` has the
# app container healthy.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "✖ kubectl not found. This host should have it via k3s." >&2
  echo "  Try: export KUBECONFIG=/etc/rancher/k3s/k3s.yaml" >&2
  exit 1
fi

# Use the cluster's first node InternalIP. In single-node k3s that's the VPS.
NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
if [[ -z "$NODE_IP" ]]; then
  echo "✖ Could not resolve node InternalIP via kubectl." >&2
  exit 1
fi
echo "==> Node InternalIP: $NODE_IP"

# Sanity: the app must already be answering on the host at 3001.
if ! curl -fsS --max-time 5 "http://127.0.0.1:3001/api/health" >/dev/null; then
  echo "✖ app not responding on 127.0.0.1:3001 — bring docker-compose up first." >&2
  exit 1
fi

kubectl apply -f 00-namespace.yaml
kubectl apply -f 10-service.yaml

# Substitute NODE_IP into the EndpointSlice template (kubectl has no built-in
# template engine; this keeps it simple).
sed "s|__NODE_IP__|$NODE_IP|" 11-endpointslice.yaml.tpl | kubectl apply -f -

kubectl apply -f 20-ingress.yaml

echo
echo "==> Waiting up to 120s for cert-manager to issue the TLS cert..."
for i in {1..24}; do
  if kubectl -n aeroabroad get secret aeroabroad-tls >/dev/null 2>&1; then
    echo "✔ aeroabroad-tls issued"
    break
  fi
  sleep 5
done

echo
echo "==> State:"
kubectl -n aeroabroad get svc,endpointslice,ingress
echo
echo "If TLS is still pending, inspect with:"
echo "  kubectl -n aeroabroad describe ingress aeroabroad"
echo "  kubectl -n aeroabroad get certificate"
