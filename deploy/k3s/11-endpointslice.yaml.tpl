# Template — apply via deploy/k3s/apply.sh which substitutes NODE_IP.
# Routes Service `aeroabroad-app` → host-network port 3001 of the node (where
# the docker-compose `app` container's loopback bind lives).
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: aeroabroad-app
  namespace: aeroabroad
  labels:
    kubernetes.io/service-name: aeroabroad-app
    app.kubernetes.io/name: aeroabroad
addressType: IPv4
ports:
  - name: http
    port: 3001
    protocol: TCP
endpoints:
  - addresses: ["__NODE_IP__"]
    conditions:
      ready: true
